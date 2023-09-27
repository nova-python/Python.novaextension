exports.run = function (cmd, opts = {}, ...args) {
    return new Promise((resolve, reject) => {
        if (!nova.fs.access(cmd, nova.fs.X_OK)) {
            reject(`${cmd} does not exist or is not executable`);
            return;
        }

        if (typeof opts === "string") {
            args.unshift(opts);
            opts = {};
        }

        let process = new Process(cmd, {
            args: args,
            stdio: "pipe",
            cwd: opts.cwd || nova.workspace.path,
            env: opts.env || {},
        });

        var stdout = [];
        var stderr = [];
        var timeoutID = opts.timeout
            ? setTimeout(() => {
                  reject("The process did not respond in a timely manner.");
                  process.terminate();
              }, opts.timeout)
            : null;

        process.onStdout((line) => stdout.push(line));
        process.onStderr((line) => stderr.push(line));
        process.onDidExit((code) => {
            if (timeoutID) clearTimeout(timeoutID);
            return resolve({
                stdout: stdout,
                stderr: stderr,
                status: code,
                success: code == 0,
            });
        });

        console.info("Running", cmd, args.join(" "));
        process.start();

        if (opts.stdin) {
            let writer = process.stdin.getWriter();
            writer.ready.then(() => {
                writer.write(opts.stdin);
                writer.close();
            });
        }
    });
};

const versionRegex = /^Python\s(\d+(\.\d+(\.\d+)?)?)/;

exports.checkEnv = function (venvDir) {
    let userRoot = nova.path.expanduser("~");
    let pythonPath = nova.path.join(venvDir, "bin", "python");
    return exports.run(pythonPath, "--version").then((result) => {
        let match = result.stdout.join("").match(versionRegex);
        let version = match ? match[1] : null;
        let relPath = venvDir.replace(userRoot, "~");
        let displayName = version ? `${relPath} (${version})` : relPath;
        return [pythonPath, displayName];
    });
};

exports.which = function (cmd) {
    // TODO: search virtualenv bin
    return exports.run("/usr/bin/which", cmd).then((result) => result.stdout[0].trim());
};

var pathCache = {};

exports.resolvePath = function (cmd, configPath) {
    if (configPath) {
        return Promise.resolve(configPath);
    }
    if (pathCache[cmd]) {
        return Promise.resolve(pathCache[cmd]);
    }
    return exports.which(cmd).then((path) => {
        console.info(`Caching path for ${cmd}: ${path}`)
        pathCache[cmd] = path;
        return path;
    });
};

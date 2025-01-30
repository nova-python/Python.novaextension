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
            shell: opts.shell || false,
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
                cmd: cmd,
                args: args,
                stdout: stdout,
                stderr: stderr,
                status: code,
                success: code == 0,
            });
        });

        if (!opts.quiet) {
            console.info("Running", cmd, args.join(" "));
        }

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

exports.activatedEnv = function (base = {}) {
    const pythonPath = nova.workspace.config.get("python.pythonPath", "string");
    if (!pythonPath) {
        return base;
    }
    const bin = nova.path.dirname(pythonPath);
    return {
        ...base,
        VIRTUAL_ENV: nova.path.dirname(bin),
        PATH: bin + ":" + nova.environment.PATH,
    };
};

exports.which = function (cmd) {
    return exports
        .run(
            "/usr/bin/which",
            {
                env: exports.activatedEnv(),
                quiet: true,
            },
            cmd
        )
        .then((result) => {
            if (result.success) {
                return result.stdout.join("").trim();
            } else {
                return Promise.reject(`${cmd} not found`);
            }
        });
};

function first(promises) {
    return Promise.allSettled(promises).then((results) => {
        let first = results.find((result) => result.status == "fulfilled");
        if (first) {
            return Promise.resolve(first.value);
        }
        return Promise.reject(new Error("No results."));
    });
}

exports.resolvePath = function (cmds, configPath) {
    if (configPath) {
        return Promise.resolve(configPath);
    }
    return first(cmds.map((cmd) => exports.which(cmd)));
};

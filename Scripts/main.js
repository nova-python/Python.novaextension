const Notification = require("Notification.js");
const PyrightLanguageServer = require("PyrightLanguageServer.js");
const Formatter = require("Formatter.js");
const Linter = require("Linter.js");
const Config = require("Config.js");
const Pip = require("Pip.js");
const PackageSidebar = require("PackageSidebar.js");
const VirtualEnvTaskAssistant = require("VirtualEnvTaskAssistant.js");
const utils = require("utils.js");

// Read from workspace, extension, and .default named configs.
const config = new Config("python");

// Encapsulation of pip commands.
const pip = new Pip(config);

// Components of the extension, each with activate/deactivate methods.
const langserver = new PyrightLanguageServer(config);
const formatter = new Formatter(config);
const linter = new Linter(config);
const sidebar = new PackageSidebar(pip);

exports.activate = function () {
    // If the built-in interpreter is set, and pythonPath is not, copy it over.
    const pythonPath = config.get("pythonPath", "string");
    const interpreter = nova.workspace.config.get("python.interpreter", "string");
    if (interpreter && !pythonPath) {
        console.info("Copying python.interpreter to pythonPath -", interpreter);
        config.set("pythonPath", interpreter);
    }

    langserver.activate();
    sidebar.activate();
    formatter.activate();
    linter.activate();
};

exports.deactivate = function () {
    langserver.deactivate();
    sidebar.deactivate();
    formatter.deactivate();
    linter.deactivate();
};

nova.commands.register("python.copyInterpreter", (workspace) => {
    const pythonPath = config.get("pythonPath", "string");
    if (pythonPath) {
        console.info("Copying pythonPath to python.interpreter -", pythonPath);
        nova.workspace.config.set("python.interpreter", pythonPath);
    }
});

nova.commands.register("python.resolveEnvs", (workspace) => {
    let venvDirs = config.get("venvDirs", "array");
    let promises = [];

    if (!venvDirs) return [];

    for (const dir of venvDirs) {
        for (const item of nova.fs.listdir(dir)) {
            let venvDir = nova.path.expanduser(nova.path.join(dir, item));
            promises.push(utils.checkEnv(venvDir));
        }
    }

    return Promise.allSettled(promises).then((iterable) => {
        return iterable
            .filter((x) => x.status == "fulfilled")
            .map((x) => x.value)
            .sort((a, b) => a[1] > b[1]);
    });
});

nova.commands.register("python.reloadPackages", (workspace) => {
    sidebar.refresh();
});

nova.commands.register("python.pipFreeze", (workspace) => {
    let filename = config.get("pipRequirements", "string", "requirements.txt");
    let path = nova.path.join(nova.workspace.path, filename);
    let note = new Notification(`Freezing ${filename}`).show();
    pip.freeze()
        .then((packages) => {
            let file = nova.fs.open(path, "w");
            file.write(packages.join("\n"));
            file.write("\n");
            file.close();
            note.dismiss();
        })
        .catch((msg) => {
            console.error(msg);
        });
});

nova.commands.register("python.upgradeAllPackages", (workspace) => {
    let filename = config.get("pipRequirementsInput", "string", "requirements.in");
    let path = nova.path.join(nova.workspace.path, filename);
    if (nova.fs.access(path, nova.fs.R_OK)) {
        let note = new Notification("Upgrading all packages").show();
        pip.upgrade(["-r", path]).then(() => {
            note.dismiss();
            sidebar.refresh();
        });
    } else {
        new Notification(`File not found: ${filename}`).show();
    }
});

nova.commands.register("python.upgradeSelectedPackages", (workspace) => {
    var packages = sidebar.selectedPackages();
    let note = new Notification(packages.join(", "), "Upgrading Packages").show();
    pip.upgrade(packages).then(() => {
        note.dismiss();
        sidebar.refresh();
    });
});

// Pyright
nova.commands.register("python.restartPyright", (workspace) => langserver.start());

// Black
nova.commands.register("python.formatWithBlack", formatter.format, formatter);
nova.commands.register("python.formatWorkspace", formatter.formatWorkspace, formatter);

// Ruff
nova.commands.register("python.checkWithRuff", (editor) => linter.manualCheck(editor));
nova.commands.register("python.fixRuffViolations", (editor) => linter.fix(editor));
nova.commands.register("python.organizeImports", (editor) =>
    linter.fix(editor, "I001")
);

// Task assistants
nova.assistants.registerTaskAssistant(new VirtualEnvTaskAssistant(config), {
    identifier: "virtualenv",
    name: "Virtualenv",
});

const utils = require("utils.js");

class VirtualEnvTaskAssistant {
    constructor(config) {
        this.config = config;
    }

    resolveTaskAction(context) {
        let pythonPath = this.config.get("pythonPath", "string");
        if (!pythonPath) {
            throw new Error("No virtual environment set!");
        }

        if (context.action != Task.Run) {
            return null;
        }

        if (context.data.type == "run") {
            let script = context.config.get("script", "string");
            let pythonModule = context.config.get("module", "string");
            let args = context.config.get("args", "array") || [];
            let workdir = context.config.get("workdir", "string");

            if (!script && !pythonModule) {
                throw new Error(
                    "No Python script or module has been set for the task."
                );
            }

            if (script) {
                let scriptPath = nova.path.join(nova.workspace.path, script);
                return new TaskProcessAction(scriptPath, {
                    args: args,
                    env: utils.activatedEnv({
                        PYTHONUNBUFFERED: "1",
                    }),
                    cwd: workdir || nova.workspace.path,
                });
            } else {
                return new TaskProcessAction(pythonPath, {
                    args: ["-m", pythonModule, ...args],
                    env: utils.activatedEnv({
                        PYTHONUNBUFFERED: "1",
                    }),
                    cwd: workdir || nova.workspace.path,
                });
            }
        }

        return null;
    }
}

module.exports = VirtualEnvTaskAssistant;

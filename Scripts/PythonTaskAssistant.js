const utils = require("utils.js");

class PythonTaskAssistant {
    constructor(config) {
        this.config = config;
    }

    resolveTaskAction(context) {
        if (context.data.name == "run") {
            let pythonPath = this.config.get("pythonPath", "string");
            if (!pythonPath) {
                throw new Error("No virtual environment set!");
            }

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
        } else if (context.data.name == "cleanup") {
            let cmd = nova.path.join(nova.extension.path, "Scripts", "clean.sh");

            let cleanCache = context.config.get("python.cleanupCacheFiles", "boolean");
            let cleanBuild = context.config.get("python.cleanupBuildDirs", "boolean");
            let cleanExtra = context.config.get("python.cleanupExtras", "pathArray");

            return new TaskProcessAction(cmd, {
                args: [nova.workspace.path],
                env: {
                    CLEAN_CACHE_FILES: cleanCache ? "1" : "0",
                    CLEAN_BUILD_ARTIFACTS: cleanBuild ? "1" : "0",
                    CLEAN_EXTRAS: cleanExtra.join(";"),
                },
            });
        }

        return null;
    }
}

module.exports = PythonTaskAssistant;

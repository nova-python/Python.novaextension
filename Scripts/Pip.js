const utils = require("utils.js");

class Pip {
    constructor(config) {
        this.config = config;
    }

    upgrade(packages) {
        return utils.run(
            this.config.get("pythonPath"),
            "-m",
            "pip",
            "install",
            "--no-input",
            "--progress-bar",
            "off",
            "--upgrade",
            ...packages
        );
    }

    freeze() {
        return utils
            .run(this.config.get("pythonPath"), "-m", "pip", "freeze")
            .then((result) => result.stdout.map((p) => p.trim()));
    }

    list() {
        return utils
            .run(
                this.config.get("pythonPath"),
                "-m",
                "pip",
                "list",
                "--format",
                "json"
            )
            .then((result) => JSON.parse(result.stdout.join("")));
    }

    outdated() {
        return utils
            .run(
                this.config.get("pythonPath"),
                "-m",
                "pip",
                "list",
                "--outdated",
                "--format",
                "json"
            )
            .then((result) => {
                let packages = JSON.parse(result.stdout.join(""));
                var outdated = {};
                for (const p of packages) {
                    outdated[p.name] = p.latest_version;
                }
                return outdated;
            });
    }

    audit() {
        let pythonPath = this.config.get("pythonPath");
        let pipAuditPath = this.config.get(
            "pipAuditPath",
            "string",
            "/opt/homebrew/bin/pip-audit"
        );
        if (!nova.fs.access(pipAuditPath, nova.fs.X_OK)) {
            console.warn("pip-audit not available; skipping vulnerability checks");
            return Promise.resolve([]);
        }
        return utils
            .run(
                pipAuditPath,
                {
                    env: {
                        PIPAPI_PYTHON_LOCATION: pythonPath,
                    },
                },
                "--format",
                "json",
                "--progress-spinner",
                "off"
            )
            .then((result) => {
                let vulnerabilities = {};
                let data = JSON.parse(result.stdout.join(""));
                for (const p of data.dependencies) {
                    if (p.vulns.length > 0) {
                        vulnerabilities[p.name] = p.vulns;
                    }
                }
                return vulnerabilities;
            });
    }
}

module.exports = Pip;

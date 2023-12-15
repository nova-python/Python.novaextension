const utils = require("utils.js");

class Pip {
    constructor(config) {
        this.config = config;
    }

    install(packages, upgrade = false) {
        const strategy = this.config.get("pipUpgradeStrategy", "string");
        const extraArgs = upgrade ? ["--upgrade", "--upgrade-strategy", strategy] : [];
        return utils.run(
            this.config.get("pythonPath"),
            "-m",
            "pip",
            "install",
            "--no-input",
            "--progress-bar",
            "off",
            ...extraArgs,
            ...packages
        );
    }

    upgrade(packages) {
        return this.install(packages, true);
    }

    uninstall(packages) {
        return utils.run(
            this.config.get("pythonPath"),
            "-m",
            "pip",
            "uninstall",
            "--no-input",
            "--yes",
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
            .run(this.config.get("pythonPath"), "-m", "pip", "list", "--format", "json")
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
        let pipAuditPath = this.config.get("pipAuditPath", "string");
        return utils.resolvePath(["pip-audit"], pipAuditPath).then(
            (cmd) => {
                return utils
                    .run(
                        cmd,
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
            },
            (reason) => {
                console.warn("Skipping pip-audit check:", reason);
                return Promise.resolve([]);
            }
        );
    }
}

module.exports = Pip;

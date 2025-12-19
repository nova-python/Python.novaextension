const utils = require("utils.js");

class Pip {
    constructor(config) {
        this.config = config;
    }

    _useUV() {
        let uvLockPath = nova.path.join(nova.workspace.path, "uv.lock");
        let pyprojectPath = nova.path.join(nova.workspace.path, "pyproject.toml");
        if (nova.fs.stat(uvLockPath) && nova.fs.stat(pyprojectPath)) return true;
        return false;
    }

    install(packages, upgrade = false) {
        if (this._useUV()) {
            nova.workspace.showErrorMessage("Package management not yet supported via uv.");
            return Promise.reject({});
        }

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
        if (this._useUV()) {
            nova.workspace.showErrorMessage("Package management not yet supported via uv.");
            return Promise.reject({});
        }

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
        if (this._useUV()) {
            return utils.resolvePath(["uv"]).then((uvPath) => {
                return utils
                    .run(uvPath, "export", "--no-hashes", "--no-dev")
                    .then((result) => result.stdout.map((p) => p.trim()));
            });
        }
        else {
            return utils
                .run(this.config.get("pythonPath"), "-m", "pip", "freeze")
                .then((result) => result.stdout.map((p) => p.trim()));
        }
    }

    list() {
        if (this._useUV()) {
            // TODO: allow setting uv path in config
            return utils.resolvePath(["uv"]).then((uvPath) => {
                return utils
                    .run(uvPath, "pip", "list", "--format", "json")
                    .then((result) => JSON.parse(result.stdout.join("")));
            });
        } else {
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
    }

    outdated() {
        if (this._useUV()) {
            return utils.resolvePath(["uv"]).then((uvPath) => {
                return utils
                    .run(uvPath, "pip", "list", "--outdated", "--format", "json")
                    .then((result) => {
                        let packages = JSON.parse(result.stdout.join(""));
                        var outdated = {};
                        for (const p of packages) {
                            outdated[p.name] = p.latest_version;
                        }
                        return outdated;
                    });
            });
        } else {
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
    }

    audit() {
        // pip-audit --disable-pip --format json --progress-spinner off -r <(uv export --quiet --no-emit-project)
        let pipAuditPath = this.config.get("pipAuditPath", "string");
        if (this._useUV()) {
            return utils.resolvePath(["pip-audit"], pipAuditPath).then((auditPath) => {
                return utils.resolvePath(["uv"]).then((uvPath) => {
                    let tmpRequirements = nova.path.join(
                        nova.fs.tempdir,
                        "requirements.txt"
                    );
                    console.log(tmpRequirements);
                    return utils
                        .run(
                            uvPath,
                            "export",
                            "--quiet",
                            "--no-emit-project",
                            "--no-hashes",
                            "-o",
                            tmpRequirements
                        )
                        .then((result) => {
                            return utils
                                .run(
                                    auditPath,
                                    "--disable-pip",
                                    "--skip-editable",
                                    "--no-deps",
                                    "--format",
                                    "json",
                                    "--progress-spinner",
                                    "off",
                                    "-r",
                                    tmpRequirements
                                )
                                .then((result) => {
                                    let vulnerabilities = {};
                                    let data = JSON.parse(result.stdout.join(""));
                                    for (const p of data.dependencies) {
                                        if (p.vulns && p.vulns.length > 0) {
                                            vulnerabilities[p.name] = p.vulns;
                                        }
                                    }
                                    return vulnerabilities;
                                });
                        });
                });
            });
        } else {
            let pythonPath = this.config.get("pythonPath");
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
                            "--skip-editable",
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
}

module.exports = Pip;

const utils = require("utils.js");

const RELOAD_PREFS = new Set([
    "python.langServer",
    "python.langServerPath",
    "python.langServerConfig",
]);

class LanguageServer {
    constructor(config) {
        this.config = config;
        this.languageClient = null;

        for (const pref of RELOAD_PREFS) {
            nova.workspace.config.onDidChange(pref, (newValue, oldValue) => {
                if (oldValue !== newValue) {
                    this.start();
                }
            });
        }
    }

    activate() {
        this.start();
    }

    deactivate() {
        this.stop();
    }

    argsForLS(ls) {
        switch (ls) {
            case "ty":
                return ["server"];
            case "pyright-langserver":
                return ["--stdio"];
            case "pyrefly":
                return ["lsp"];
            default:
                return [];
        }
    }

    start() {
        this.stop();

        if (!this.config.get("langServerEnabled", "boolean", true)) {
            return;
        }

        const whichLS = this.config.get("langServer", "string", "ty");
        const lsPath = this.config.get("langServerPath", "string");
        utils.resolvePath([whichLS], lsPath).then((path) => {
            console.info("Found language server:", path);
            var client = new LanguageClient(
                whichLS,
                whichLS,
                {
                    path: path,
                    args: this.argsForLS(whichLS),
                },
                {
                    syntaxes: ["python"],
                    debug: false,
                },
            );

            try {
                client.start();
                nova.subscriptions.add(client);
                this.languageClient = client;
                if (whichLS == "pyright-langserver") {
                    setTimeout(() => {
                        client.sendNotification("workspace/didChangeConfiguration", {});
                    }, 250);
                }
            } catch (err) {
                if (nova.inDevMode()) {
                    console.error(err);
                }
            }
        });
    }

    stop() {
        if (this.languageClient) {
            this.languageClient.stop();
            nova.subscriptions.remove(this.languageClient);
            this.languageClient = null;
        }
    }
}

module.exports = LanguageServer;

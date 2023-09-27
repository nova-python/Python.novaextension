const RELOAD_PREFS = new Set([
    // Our extension
    "python.pyrightPath",
    "python.pyrightEnabled",
    // Pyright config names
    "python.pythonPath",
    "python.analysis.diagnosticMode",
    "python.analysis.typeCheckingMode",
    "python.analysis.stubPath",
    "python.analysis.extraPaths",
]);

class PyrightLanguageServer {
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

    start() {
        this.stop();

        if (!this.config.get("pyrightEnabled", "boolean", true)) {
            return;
        }

        const path = this.config.get(
            "pyrightPath",
            "string",
            "/opt/homebrew/bin/pyright-langserver"
        );

        var client = new LanguageClient(
            "pyright",
            "Pyright",
            {
                path: path,
                args: ["--stdio"],
            },
            {
                syntaxes: ["python"],
                debug: false,
            }
        );

        try {
            client.start();
            nova.subscriptions.add(client);
            this.languageClient = client;
            setTimeout(() => {
                client.sendNotification("workspace/didChangeConfiguration", {});
            }, 250);
        } catch (err) {
            if (nova.inDevMode()) {
                console.error(err);
            }
        }
    }

    stop() {
        if (this.languageClient) {
            this.languageClient.stop();
            nova.subscriptions.remove(this.languageClient);
            this.languageClient = null;
        }
    }
}

module.exports = PyrightLanguageServer;

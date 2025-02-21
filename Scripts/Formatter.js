const utils = require("utils.js");

class Formatter {
    constructor(config) {
        this.config = config;
    }

    activate() {
        nova.subscriptions.add(
            nova.workspace.onDidAddTextEditor((editor) => {
                editor.onWillSave(this.maybeFormat, this);
            })
        );
    }

    deactivate() {}

    argsForCommand(cmd, filename, directory = null) {
        const executable = this.config.get("formatterPath", "string");
        const extraArgs = this.config.get("formatterArgs", "array", []);
        const fileArgs = filename ? ["--stdin-filename", filename] : [];
        const target = directory || "-";

        if (cmd.endsWith("ruff")) {
            return ["format", "--quiet", ...extraArgs, ...fileArgs, target];
        } else if (cmd.endswith("black")) {
            return ["--quiet", ...extraArgs, ...fileArgs, target];
        }

        return extraArgs;
    }

    run(stdin, filename, directory = null) {
        const executable = this.config.get("formatterPath", "string");
        const opts = { stdin: stdin };
        const self = this;

        return utils.resolvePath(["ruff", "black"], executable).then((cmd) => {
            const finalArgs = self.argsForCommand(cmd, filename, directory);
            return utils.run(cmd, opts, ...finalArgs);
        });
    }

    format(editor) {
        if (editor.document.isEmpty) {
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);

        return this.run(content, editor.document.path).then((result) => {
            if (result.success) {
                const formattedContent = result.stdout.join("");
                return editor.edit((edit) => {
                    if (formattedContent !== content) {
                        edit.replace(
                            textRange,
                            formattedContent,
                            InsertTextFormat.PlainText
                        );
                    }
                });
            }
        });
    }

    maybeFormat(editor) {
        if (!this.config.get("formatOnSave", "boolean")) return;
        if (editor.document.syntax !== "python") return;
        return this.format(editor);
    }

    formatWorkspace(workspace) {
        return this.run(null, null, workspace.path);
    }
}

module.exports = Formatter;

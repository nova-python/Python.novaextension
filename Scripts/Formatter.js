const utils = require("utils.js");

class Formatter {
    constructor(config) {
        this.config = config;
        this.executableCache = null;
    }

    activate() {
        nova.subscriptions.add(
            nova.workspace.onDidAddTextEditor((editor) => {
                editor.onWillSave(this.maybeFormat, this);
            })
        );
    }

    deactivate() {}

    run(stdin, ...args) {
        const executable = this.config.get("formatterPath", "string");
        const extraArgs = this.config.get("formatterArgs", "array", []);
        const finalArgs = [...extraArgs, ...args];
        const opts = { stdin: stdin };

        return utils.resolvePath("black", executable).then((cmd) => {
            return utils.run(cmd, opts, ...finalArgs);
        });
    }

    format(editor) {
        if (editor.document.isEmpty) {
            return;
        }

        const filename = editor.document.path
            ? nova.path.basename(editor.document.path)
            : null;

        const defaultArgs = filename
            ? ["--stdin-filename", filename, "--quiet", "-"]
            : ["--quiet", "-"];

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);

        return this.run(content, ...defaultArgs).then((result) => {
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
        return this.run(null, "--quiet", ".");
    }
}

module.exports = Formatter;

const utils = require("utils.js");

class Linter {
    constructor(config) {
        this.config = config;
        this.issues = null;
        this.listener = null;
        this.assistant = null;
    }

    activate() {
        this.issues = new IssueCollection("ruff");
        this.listener = nova.workspace.config.observe(
            "python.linterCheckMode",
            (mode) => {
                if (mode == "onSave" || mode == "onChange") {
                    // Automatic check modes.
                    if (this.assistant) this.assistant.dispose();
                    this.assistant = nova.assistants.registerIssueAssistant(
                        "python",
                        this,
                        { event: mode }
                    );
                } else {
                    // Manual check mode.
                    if (this.assistant) {
                        this.assistant.dispose();
                        this.assistant = null;
                    }
                    this.issues.clear();
                }
            }
        );
    }

    deactivate() {
        if (this.assistant) {
            this.assistant.dispose();
            this.assistant = null;
        }
        this.listener.dispose();
        this.listener = null;
        this.issues.dispose();
        this.issues = null;
    }

    run(stdin, fix = null) {
        const executable = this.config.get("linterPath", "string");
        const userArgs = this.config.get("linterArgs", "array", []);
        const selectArgs = fix ? ["--select", fix, "--fix"] : [];
        const finalArgs = [
            "check",
            ...userArgs,
            ...selectArgs,
            "--format",
            "github",
            "--quiet",
            "-",
        ];
        const opts = { stdin: stdin };

        return utils.resolvePath("ruff", executable).then((cmd) => {
            return utils.run(cmd, opts, ...finalArgs);
        });
    }

    check(editor) {
        if (editor.document.isEmpty) {
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);

        return this.run(content).then((result) => {
            const parser = new IssueParser("ruff");
            for (const line of result.stdout) {
                parser.pushLine(line);
            }
            return parser.issues;
        });
    }

    fix(editor, select = "ALL") {
        if (editor.document.isEmpty) {
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);

        return this.run(content, select).then((result) => {
            if (result.success) {
                const newContent = result.stdout.join("");
                return editor.edit((edit) => {
                    if (newContent !== content) {
                        edit.replace(textRange, newContent, InsertTextFormat.PlainText);
                    }
                });
            }
        });
    }

    manualCheck(editor) {
        if (this.assistant) return;
        this.check(editor).then((issues) => {
            this.issues.set(editor.document.uri, issues);
        });
    }

    provideIssues(editor) {
        this.issues.clear();
        return this.check(editor);
    }
}

module.exports = Linter;

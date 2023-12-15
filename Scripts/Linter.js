const utils = require("utils.js");

const LinterAction = {
    Check: "check",
    Fix: "fix",
    Organize: "organize",
};

class Linter {
    constructor(config) {
        this.config = config;
        this.issues = null;
        this.listener = null;
        this.assistant = null;
    }

    activate() {
        this.issues = new IssueCollection();
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

    argsForCommand(cmd, action, directory) {
        const userArgs = this.config.get("linterArgs", "array", []);
        const finalArgs = ["check", "--quiet", ...userArgs];
        if (action == LinterAction.Fix) {
            finalArgs.push("--fix");
        } else if (action == LinterAction.Organize) {
            finalArgs.push("--select", "I001", "--fix");
        } else {
            finalArgs.push("--format", "github");
        }
        finalArgs.push(directory || "-");
        return finalArgs;
    }

    run(stdin, action = LinterAction.Check, directory = null) {
        const executable = this.config.get("linterPath", "string");
        const opts = { stdin: stdin };
        const self = this;

        return utils.resolvePath(["ruff"], executable).then((cmd) => {
            const finalArgs = self.argsForCommand(cmd, action, directory);
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

    fix(editor, action = LinterAction.Fix) {
        if (editor.document.isEmpty) {
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);

        return this.run(content, action).then((result) => {
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

    fixWorkspace(workspace) {
        return this.run(null, LinterAction.Fix, workspace.path);
    }

    organize(editor) {
        return this.fix(editor, LinterAction.Organize);
    }

    organizeWorkspace(workspace) {
        return this.run(null, LinterAction.Organize, workspace.path);
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

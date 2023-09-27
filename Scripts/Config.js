class Config {
    constructor(prefix = null, defaultSuffix = "default") {
        this.prefix = prefix || nova.extension.identifier;
        this.defaultSuffix = defaultSuffix;
    }

    get(name, coerce, defaultValue = null) {
        const qname = this.prefix + "." + name;
        // First try the workspace config
        const workspaceValue = nova.workspace.config.get(qname, coerce);
        if (workspaceValue !== null) {
            return workspaceValue;
        }
        // Then look in the extension config
        const globalValue = nova.config.get(qname, coerce);
        if (globalValue !== null) {
            return globalValue;
        }
        // Look for <name>.default in the extension config
        const dname = qname + "." + this.defaultSuffix;
        const globalDefault = nova.config.get(dname, coerce);
        if (globalDefault !== null) {
            return globalDefault;
        }
        // Fall back to the passed in default value
        return defaultValue;
    }

    set(name, value) {
        nova.workspace.config.set(this.prefix + "." + name, value);
    }

    remove(name) {
        nova.workspace.config.remove(this.prefix + "." + name);
    }
}

module.exports = Config;

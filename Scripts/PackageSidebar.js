const Notification = require("Notification.js");

class PackageDataProvider {
    constructor(pip) {
        this.pip = pip;
        this.packages = [];
    }

    reload() {
        return Promise.all([
            this.pip.list(),
            this.pip.outdated(),
            this.pip.audit(),
        ]).then(([packages, outdated, vulns]) => {
            for (const i in packages) {
                packages[i].latest_version = outdated[packages[i].name];
                packages[i].vulnerabilities = vulns[packages[i].name];
            }
            this.packages = packages;
            return packages;
        });
    }

    getChildren(element) {
        if (element) {
            return element.vulnerabilities || [];
        } else {
            return this.packages;
        }
    }

    getTreeItem(element) {
        if (element.id) {
            // Vulnerability
            let item = new TreeItem(element.id);
            if (element.fix_versions.length > 0) {
                item.descriptiveText = "(" + element.fix_versions.join(", ") + ")";
            }
            item.image = "__symbol.bookmark";
            item.tooltip = element.description;
            return item;
        }

        // Top level package
        let item = new TreeItem(element.name);
        item.contextValue = element.name;
        if (element.latest_version) {
            item.descriptiveText = element.version + " → " + element.latest_version;
            item.color = Color.rgb(0.8, 0.8, 0);
        } else {
            item.descriptiveText = element.version;
            item.color = Color.rgb(0, 0.5, 0);
        }

        if (element.vulnerabilities) {
            item.color = Color.rgb(1, 0, 0);
            item.collapsibleState = TreeItemCollapsibleState.Expanded;
        }

        return item;
    }
}

class PackageSidebar {
    constructor(pip) {
        this.pip = pip;
        this.data = new PackageDataProvider(pip);
        this.tree = null;
    }

    activate() {
        this.tree = new TreeView("python.packages.installed", {
            dataProvider: this.data,
        });
        nova.subscriptions.add(this.tree);
    }

    deactivate() {
        this.tree = null;
    }

    refresh() {
        let note = new Notification("Refreshing package list...").show();
        let tree = this.tree;
        this.data.reload().then(
            (packages) => {
                tree.reload();
                note.dismiss();
            },
            (error) => {
                note.dismiss();
                Notification.error(error);
            }
        );
    }

    selectedPackages() {
        return this.tree ? this.tree.selection.map((item) => item.name) : [];
    }
}

module.exports = PackageSidebar;

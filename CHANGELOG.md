## Version 1.3.1 - 2024.09.27

* Minor bug fix when no `venvDirs` set


## Version 1.3.0 - 2024.05.10

* Added a `Fix and Organize Imports (Workspace)` command
* Search workspace root for virtual environments (`.venv`, etc.)
* Recognize `requirements.lock` and `requirements-dev.lock` as requirements files
* Updated to latest [tree-sitter-requirements](https://github.com/tree-sitter-grammars/tree-sitter-requirements)


## Version 1.2.1 - 2024.04.03

* Added support for Pyright's `pyright.disableTaggedHints` setting


## Version 1.2 - 2023.12.15

* New commands for fixing all violations or organizing all imports in your workspace
* Support (and prefer) `ruff format` in addition to `black`
* New workspace settings for fixing violations and organizing imports on editor save
* Workspace cleanup was not properly removing .egg-info directories


## Version 1.1 - 2023.12.14

* Task, command, and settings for cleaning up Python cache files and build artifacts (#4)
* New setting for Pip's `--upgrade-strategy` option (#3)


## Version 1.0

Initial release

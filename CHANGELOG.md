## Version 1.6.0 - 2025.12.19

* Added support for the [ty](https://docs.astral.sh/ty/) and [pyrefly](https://pyrefly.org) language servers


## Version 1.5.0 - 2025.11.22

* Support for `autopep8` (#16)
* Allow setting environment variables for Virtual Environment tasks (#15)


## Version 1.4.1 - 2025.02.21

* Fixed an issue where `--stdin-filename` was not being passed to `ruff` (#10)


## Version 1.4.0 - 2025.01.30

* Fixed an issue where imports were not sorted on save if linting errors exist in the file
* **Initial support for uv!**
    * Use `uv` when available for freezing requirements (via `uv export`)
    * Use `uv` for the package sidebar (much faster to show outdated and audit)


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

🔋 A batteries-included **Python** extension for [Nova](https://nova.app)!


## What's in the box?

* Integration with several language servers:
    * [Pyright](https://microsoft.github.io/pyright/#/)
    * [Pyrefly](https://pyrefly.org/)
    * [ty](https://docs.astral.sh/ty/)
* Code formatting using:
    * [Ruff](https://docs.astral.sh/ruff/)
    * [Black](https://black.readthedocs.io/en/stable/)
    * [autopep8](https://pypi.org/project/autopep8/)
* Linting (and import organization) with [Ruff](https://docs.astral.sh/ruff/)
* A Virtual Environment task for running a script or Python module as though the project's virtual environment is active
* A Cleanup task for clearing out Python cache files, build artifacts, and other files/directories
* A tree-sitter based syntax for `requirements.txt` files, based off of [tree-sitter-requirements](https://github.com/tree-sitter-grammars/tree-sitter-requirements)
* A sidebar showing all packages installed in your configured Python environment, along with any outdated versions, and optionally any known vulnerabilities using [pip-audit](https://github.com/pypa/pip-audit)

![Python Sidebar](https://github.com/nova-python/Python.novaextension/raw/main/python-sidebar.png)


## Requirements

If you use [Homebrew](https://brew.sh), the easiest way to get started is:

`brew install pyright pyrefly ty uv ruff pip-audit`

This extension will try to find tools installed on your `PATH`, so installing into your virtual environment or another location should work, as well.


## Language Server Configuration

Selecting which language server to use can be done in Nova's extension and project settings dialogs. Further editor configuration for each language server is done by editing `.nova/Configuration.json` directly. See the following documentaion for available settings:

* [Pyright settings](https://microsoft.github.io/pyright/#/settings)
* [Pyrefly settings](https://pyrefly.org/en/docs/IDE/#customization)
* [ty settings](https://docs.astral.sh/ty/reference/editor-settings/)

**Note**: _Previous versions allowed setting certain Pyright-specific settings through the UI. These UI options have been removed since settings differ greatly between language servers._


## Acknowledgements

This project drew inspiration (and code!) from many others that came before it:

* [Pyreet](https://codeberg.org/rv/nova-pyreet)
* [Pyright for Nova](https://github.com/belcar-s/nova-pyright)
* [Black Nova Extension](https://github.com/Aeron/Black.novaextension) and [Ruff Nova Extension](https://github.com/Aeron/Ruff.novaextension)


## Attributions

* [Snowflake icons created by Good Ware - Flaticon](https://www.flaticon.com/free-icons/snowflake)
* [Up arrow icons created by Ayub Irawan - Flaticon](https://www.flaticon.com/free-icons/up-arrow)
* [Python icon by Anja van Staden](https://iconduck.com/icons/85785/python)

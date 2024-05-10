🔋 A batteries-included **Python** extension for [Nova](https://nova.app)!


## What's in the box?

* Integration with Microsoft's [Pyright language server](https://microsoft.github.io/pyright/#/)
* Code formatting using [Ruff](https://docs.astral.sh/ruff/) or [Black](https://black.readthedocs.io/en/stable/)
* Linting (and import organization) with [Ruff](https://docs.astral.sh/ruff/)
* A Virtual Environment task for running a script or Python module as though the project's virtual environment is active
* A Cleanup task for clearing out Python cache files, build artifacts, and other files/directories
* A tree-sitter based syntax for `requirements.txt` files, based off of [tree-sitter-requirements](https://github.com/tree-sitter-grammars/tree-sitter-requirements)
* A sidebar showing all packages installed in your configured Python environment, along with any outdated versions, and optionally any known vulnerabilities using [pip-audit](https://github.com/pypa/pip-audit)

![Python Sidebar](https://github.com/nova-python/Python.novaextension/raw/main/python-sidebar.png)


## Requirements

If you use [Homebrew](https://brew.sh), the easiest way to get started is:

`brew install pyright ruff pip-audit`

This extension will try to find tools installed on your `PATH`, so installing into your virtual environment or another location should work, as well.


## Acknowledgements

This project drew inspiration (and code!) from many others that came before it:

* [Pyreet](https://codeberg.org/rv/nova-pyreet)
* [Pyright for Nova](https://github.com/belcar-s/nova-pyright)
* [Black Nova Extension](https://github.com/Aeron/Black.novaextension) and [Ruff Nova Extension](https://github.com/Aeron/Ruff.novaextension)


## Attributions

* [Snowflake icons created by Good Ware - Flaticon](https://www.flaticon.com/free-icons/snowflake)
* [Up arrow icons created by Ayub Irawan - Flaticon](https://www.flaticon.com/free-icons/up-arrow)
* [Python icon by Anja van Staden](https://iconduck.com/icons/85785/python)

#!/bin/sh

echo "Cleaning workspace: $1"

if [ "$CLEAN_CACHE_FILES" = "1" ]
then
    echo "  * cleaning cache files"
    find $1 -type d -name '__pycache__' -print0 | xargs -0 rm -r
    find $1 -type f -name '*.pyc' -print0 | xargs -0 rm
fi

if [ "$CLEAN_BUILD_ARTIFACTS" = "1" ]
then
    echo "  * cleaning build artifacts"
    rm -rf "$1/dist" "$1/build" "$1/*.egg-info"
fi

if [ "$CLEAN_EXTRAS" != "" ]
then
    echo "  * cleaning extra files/directories"
    IFS=';'
    for name in $CLEAN_EXTRAS; do
        echo "    * $name"
        rm -rf "$1/$name"
    done
fi

#!/usr/bin/env bash
# beyondme installer for Mac/Linux.
#
# Uses Node, which SillyTavern already requires, so there's nothing extra
# to install.

set -e
cd "$(dirname "$0")"

echo
echo "  beyondme installer"
echo "  ------------------"
echo

if ! command -v node >/dev/null 2>&1; then
    echo "  Node.js was not found."
    echo
    echo "  SillyTavern needs Node to run, so if SillyTavern works on this"
    echo "  machine, Node is installed but not on your PATH. Otherwise get it"
    echo "  from https://nodejs.org and run this again."
    echo
    exit 1
fi

node install.js "$@"
echo

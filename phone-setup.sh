#!/usr/bin/env bash
# beyondme — phone setup. Nothing to type beyond running this.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found. SillyTavern needs it, so if SillyTavern runs here"
    echo "it is installed but not on your PATH."
    exit 1
fi
node phone-setup.js

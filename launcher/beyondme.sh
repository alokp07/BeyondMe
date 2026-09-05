#!/usr/bin/env bash
# beyondme launcher (Mac/Linux).
# Leaner than start.sh: dependencies are already installed, so skip the npm
# install pass that runs on every launch. Use start.sh after a git pull.
cd "$(dirname "$0")"
export NODE_ENV=production
node server.js "$@"
echo
echo "beyondme has stopped."

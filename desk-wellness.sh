#!/bin/bash
# Launcher script for Flatpak builds
# Sets XDG_CONFIG_HOME so Electron stores its data in the Flatpak sandbox
export ELECTRON_IS_DEV=0
exec /app/lib/desk-wellness/node_modules/.bin/electron \
  --no-sandbox \
  /app/lib/desk-wellness/main.js "$@"

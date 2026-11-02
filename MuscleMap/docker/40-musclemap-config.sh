#!/bin/sh
# Writes config.js from the SPARKY_URL environment variable each time the container starts.
set -e
url="${SPARKY_URL:-}"
esc=$(printf '%s' "$url" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf 'window.MUSCLEMAP_CONFIG = { sparkyUrl: "%s" };\n' "$esc" > /usr/share/nginx/html/config.js

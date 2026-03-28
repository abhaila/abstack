#!/bin/bash
set -e

PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT}"

if [ ! -d "$PLUGIN_DIR/node_modules" ]; then
  echo "Installing sequence-database plugin dependencies..."

  cd "$PLUGIN_DIR"

  if command -v pnpm &> /dev/null; then
    pnpm install --silent
  elif command -v npm &> /dev/null; then
    npm install --silent
  else
    echo "Error: Neither pnpm nor npm found. Please install Node.js." >&2
    exit 1
  fi

  echo "sequence-database plugin dependencies installed."
fi

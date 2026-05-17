#!/bin/sh
set -e

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.stamp ]; then
  echo "Installing frontend dependencies..."
  npm ci
  mkdir -p node_modules
  touch node_modules/.package-lock.stamp
fi

exec npm run dev -- --host 0.0.0.0 --port 5173

#!/bin/sh
set -e
echo "[startup] Running prisma db push..."
./node_modules/.bin/prisma db push --accept-data-loss --skip-generate
echo "[startup] DB ready, starting node on port ${PORT:-3000}..."
exec node dist/index.js

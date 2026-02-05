#!/bin/sh
set -e

echo "Checking database schema..."
node node_modules/prisma/build/index.js db push --skip-generate || echo "Schema already in sync"

echo "Starting application..."
exec node server.js
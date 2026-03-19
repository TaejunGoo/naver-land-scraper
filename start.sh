#!/bin/sh

# Ensure data directory exists (for Railway Volume mount)
mkdir -p /app/data

# Initialize database if it doesn't exist yet
if [ ! -f /app/data/dev.db ]; then
  echo "[Init] Creating new database..."
  cd /app/backend
  npx prisma db push --accept-data-loss
  cd /app
else
  echo "[Init] Database file found, skipping initialization."
fi

# Generate Prisma client (ensure it matches current schema)
cd /app/backend
npx prisma generate

# Start the server
echo "[Start] Launching server on port ${PORT:-5500}..."
node dist/index.js

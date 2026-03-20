#!/bin/sh

# Ensure data directory exists (for Railway Volume mount)
mkdir -p /app/data

# ─── Chromium 경로 자동 감지 ──────────────────────────────────────
# 설치된 Chromium 실행 파일 위치를 찾아 CHROME_PATH 환경변수로 설정
CHROME_PATH_DETECTED=$(which chromium 2>/dev/null \
  || which chromium-browser 2>/dev/null \
  || which google-chrome-stable 2>/dev/null \
  || which google-chrome 2>/dev/null \
  || echo "")

if [ -n "$CHROME_PATH_DETECTED" ]; then
  export CHROME_PATH="$CHROME_PATH_DETECTED"
  echo "[Chrome] Found at: $CHROME_PATH"
else
  echo "[Chrome] WARNING: Chromium not found in PATH. Scraping may fail."
fi

# ─── DB 초기화 ────────────────────────────────────────────────────
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

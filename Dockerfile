# ─── Stage 1: Build ────────────────────────────────────────────
FROM node:20-slim AS builder

# Puppeteer v21+: PUPPETEER_SKIP_DOWNLOAD 으로 Chromium 다운로드 완전 차단
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# 1. Install frontend dependencies and build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Install backend dependencies and build
COPY backend/package*.json ./backend/
# npm ci 실행 시에도 명시적으로 env var를 인라인으로 전달 (postinstall 스크립트 차단)
RUN cd backend && PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --ignore-scripts=false

COPY backend/ ./backend/
RUN cd backend && npx prisma generate
RUN cd backend && npm run build

# ─── Stage 2: Runtime ──────────────────────────────────────────
FROM node:20-slim

# Install Chromium and Korean fonts for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-cjk \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Copy backend production files
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/dist/ ./backend/dist/
COPY --from=builder /app/backend/prisma/ ./backend/prisma/
COPY --from=builder /app/backend/node_modules/ ./backend/node_modules/

# Copy frontend build output
COPY --from=builder /app/frontend/dist/ ./frontend/dist/

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Data directory for SQLite (will be mounted as Railway Volume)
RUN mkdir -p /app/data

EXPOSE 5500

ENV PORT=5500
ENV DATABASE_URL="file:/app/data/dev.db"

CMD ["./start.sh"]

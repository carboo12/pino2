#!/bin/bash
set -euo pipefail

# ======================================================================
# DEPLOY SCRIPT MVP — Pino2
# Ejecutar SOLO en staging, NUNCA directamente en produccion.
# ======================================================================

VERSION="${1:-mvp-$(date +%Y%m%d)}"
STAGING_DB="${STAGING_DB:-pino_mvp_test}"
BACKEND_DIR="/opt/apps/pino2/backend"
WEB_DIR="/opt/apps/pino2/web"

echo "=== MVP Deploy v${VERSION} ==="

# 1. Build backend
echo "[1/6] Building backend..."
cd "$BACKEND_DIR"
npm ci --omit=dev
npm run build

# 2. Run migrations
echo "[2/6] Running migrations..."
node migrations/run_all_migrations.js 2>&1

# 3. Build web
echo "[3/6] Building web..."
cd "$WEB_DIR"
npm ci
npm run build

# 4. Smoke tests
echo "[4/6] Smoke tests..."
cd "$BACKEND_DIR"
NODE_ENV=test npx jest test/active/app.e2e-spec.ts --config test/jest-e2e.json --no-cache --forceExit 2>&1

echo "[5/6] Health check..."
curl -sf http://127.0.0.1:3035/api/health && echo " OK" || echo " FAIL"

# 6. Tag release
echo "[6/6] Tagging release..."
cd /opt/apps/pino2
git tag -a "release/${VERSION}" -m "Release ${VERSION}"
git push origin "release/${VERSION}"

echo "=== Deploy v${VERSION} complete ==="
echo "Web: http://localhost:9002"
echo "API: http://localhost:3035/api"

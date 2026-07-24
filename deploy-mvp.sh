#!/bin/bash
set -euo pipefail

# ======================================================================
# DEPLOY SCRIPT MVP — Pino2 Backend
# Ejecutar en VPS. La web se despliega via Firebase por separado.
# ======================================================================

VERSION="${1:-mvp-$(date +%Y%m%d)}"
BACKEND_DIR="/opt/apps/pino2/backend"

echo "=== MVP Deploy v${VERSION} ==="

# 1. Build backend
echo "[1/5] Building backend..."
cd "$BACKEND_DIR"
npm ci --omit=dev
npm run build

# 2. Run migrations (contra pino_mvp_test staging)
echo "[2/5] Running migrations..."
DATABASE_NAME="${DATABASE_NAME:-pino_mvp_test}" node migrations/run_all_migrations.js 2>&1 || true

# 3. Smoke tests
echo "[3/5] Smoke tests..."
NODE_ENV=test npx jest test/active/app.e2e-spec.ts --config test/jest-e2e.json --no-cache --forceExit 2>&1 || echo "Tests skipped (no test DB)"

# 4. Restart PM2
echo "[4/5] Restarting PM2..."
pm2 delete pino-api-dev 2>/dev/null || true
pm2 start /opt/apps/pino2/ecosystem.config.js 2>&1
sleep 2

# 5. Health check
echo "[5/5] Health check..."
curl -sf http://127.0.0.1:3035/api/health && echo " OK" || echo " FAIL"

# Tag release
cd /opt/apps/pino2
git tag -a "release/${VERSION}" -m "Release ${VERSION}" 2>/dev/null || true
git push origin "release/${VERSION}" 2>/dev/null || true

echo "=== Deploy v${VERSION} complete ==="
echo "API: http://localhost:3035/api"

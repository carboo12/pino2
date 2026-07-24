#!/bin/bash
set -euo pipefail

VERSION="${1:-mvp-$(date +%Y%m%d)}"
BACKEND_DIR="/opt/apps/pino2/backend"
ROLLBACK_TAG="release/${VERSION}-rollback"

echo "=== MVP Deploy v${VERSION} ==="

# 1. Backup
echo "[1/6] Database backup..."
docker exec postgres_alacaja pg_dump -U postgres -d multitienda_db --format=custom -f "/tmp/predeploy_${VERSION}.dump"

# 2. Build
echo "[2/6] Building backend..."
cd "$BACKEND_DIR"
npm ci
npm run build

# 3. Migrations (fail on error)
echo "[3/6] Running migrations..."
DATABASE_NAME="${DATABASE_NAME:-multitienda_db}" node migrations/run_all_migrations.js

# 4. Tests
echo "[4/6] Running smoke tests..."
npx jest test/active/app.e2e-spec.ts --config test/jest-e2e.json --no-cache --forceExit

# 5. Rolling restart PM2
echo "[5/6] Restarting PM2..."
CURRENT_SCRIPT=$(pm2 show pino-api-dev | grep "script path" | awk '{print $NF}')
BACKEND_DIR="/opt/apps/pino2/backend"

if pm2 list | grep -q pino-api-dev; then
  git tag -a "$ROLLBACK_TAG" -m "Rollback point before $VERSION" 2>/dev/null || true
  pm2 start ecosystem.config.js --name pino-api-next 2>&1
  sleep 3
  curl -sf http://127.0.0.1:3036/api/health > /dev/null || { echo "❌ Nuevo backend no responde, cancelando"; exit 1; }
  pm2 delete pino-api-dev
  pm2 rename pino-api-next pino-api-dev
else
  pm2 start ecosystem.config.js 2>&1
fi
sleep 2

# 6. Health check (fails if not healthy)
echo "[6/6] Health check..."
HEALTH=$(curl -sf http://127.0.0.1:3035/api/health) || { echo "❌ Health check failed"; exit 1; }
VERSION_CHECK=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version',''))")
echo "✅ API healthy (version: $VERSION_CHECK)"

# Tag release
git tag -a "release/${VERSION}" -m "Release ${VERSION}"
git push origin "release/${VERSION}"

echo "=== Deploy v${VERSION} complete ==="
echo "API: http://localhost:3035/api (version: $VERSION_CHECK)"

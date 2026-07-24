#!/bin/bash
set -euo pipefail

echo "=== Rollback ==="
TAG="${1:-release/last-good}"

# Restore from tag
git fetch origin
git checkout "$TAG" -- backend/

# Rebuild
cd /opt/apps/pino2/backend
npm ci
npm run build

# Restart
pm2 delete pino-api-dev 2>/dev/null || true
pm2 start /opt/apps/pino2/ecosystem.config.js
sleep 2

# Check
curl -sf http://127.0.0.1:3035/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Rollback OK: v{d[\"version\"]}')"

#!/bin/bash
set -euo pipefail

VERSION="${1:-latest}"
BACKUP_FILE="/tmp/edge_preupdate_$(date +%Y%m%d_%H%M%S).dump"

echo "=== Actualizando nodo EDGE a ${VERSION} ==="

# Backup
docker compose exec -T postgres pg_dump -U pino_app -d multitienda_edge --format=custom > "$BACKUP_FILE"
echo "Backup: $BACKUP_FILE"

# Pull nueva imagen
RELEASE_TAG=$VERSION docker compose pull api

# Rolling restart
docker compose up -d --no-deps api

# Health check
sleep 3
curl -sf http://127.0.0.1:3035/api/health || { echo "Health check failed"; exit 1; }

echo "=== Actualizacion completa ==="

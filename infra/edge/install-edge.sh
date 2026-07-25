#!/bin/bash
set -euo pipefail

echo "=== Instalacion nodo EDGE Pino2 ==="

# Verificar requisitos
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose required"; exit 1; }

# Cargar configuracion
if [ -f .env ]; then
  set -a; source .env; set +a
else
  echo "Crear .env desde .env.example primero"
  exit 1
fi

# Crear red
docker network inspect pino2-edge >/dev/null 2>&1 || docker network create pino2-edge

# Iniciar servicios
docker compose up -d

# Esperar health
sleep 5
curl -sf http://127.0.0.1:3035/api/health || { echo "Health check failed"; exit 1; }

echo "=== Nodo EDGE instalado ==="
echo "API: http://127.0.0.1:3035"

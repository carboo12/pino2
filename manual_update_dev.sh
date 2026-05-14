#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_DIR="$ROOT_DIR/web"
WEB_DIST_DIR="$WEB_DIR/dist"
WEB_PUBLISH_DIR="/var/www/dev"
PM2_NAME="pino-api-dev"
BRANCH="main"

MODE="${1:-all}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Falta comando requerido: $1"
}

install_node_deps() {
  local dir="$1"
  if [ -f "$dir/package-lock.json" ]; then
    npm --prefix "$dir" ci --no-audit --no-fund
  else
    npm --prefix "$dir" install --no-audit --no-fund
  fi
}

update_repo() {
  log "Actualizando repositorio desde origin/$BRANCH"
  git -C "$ROOT_DIR" fetch origin "$BRANCH"
  git -C "$ROOT_DIR" checkout "$BRANCH"
  git -C "$ROOT_DIR" pull --ff-only origin "$BRANCH"
}

resolve_backend_entry() {
  local candidate
  for candidate in "$BACKEND_DIR/dist/main.js" "$BACKEND_DIR/dist/src/main.js"; do
    if [ -f "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done

  die "No se generó entrypoint backend esperado (dist/main.js o dist/src/main.js)"
}

deploy_backend() {
  [ -f "$BACKEND_DIR/.env" ] || die "Falta $BACKEND_DIR/.env"

  log "Instalando dependencias backend"
  install_node_deps "$BACKEND_DIR"

  log "Aplicando migraciones de base de datos"
  node "$BACKEND_DIR/migrations/run_migration.js" 2026-04-20_distribucion.sql
  node "$BACKEND_DIR/migrations/run_migration.js" 2026-04-21_barcode_refactor.sql

  log "Compilando backend"
  npm --prefix "$BACKEND_DIR" run build

  local entry
  entry="$(resolve_backend_entry)"
  log "Entrypoint backend detectado: $entry"

  if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
    local description
    description="$(pm2 describe "$PM2_NAME" 2>/dev/null || true)"

    if [[ "$description" == *"script path       │ $entry"* ]] &&
      [[ "$description" == *"exec cwd          │ $BACKEND_DIR"* ]]; then
      log "Reiniciando PM2 $PM2_NAME"
      pm2 restart "$PM2_NAME" --update-env
    else
      log "PM2 $PM2_NAME apunta a otra carpeta. Recreando proceso con $BACKEND_DIR"
      pm2 delete "$PM2_NAME"
      pm2 start "$entry" --name "$PM2_NAME" --cwd "$BACKEND_DIR"
    fi
  else
    log "Creando PM2 $PM2_NAME"
    pm2 start "$entry" --name "$PM2_NAME" --cwd "$BACKEND_DIR"
  fi
}

deploy_web() {
  [ -d "$WEB_PUBLISH_DIR" ] || die "No existe directorio de publicación $WEB_PUBLISH_DIR"

  log "Instalando dependencias frontend"
  install_node_deps "$WEB_DIR"

  log "Compilando frontend React para /dev"
  (
    cd "$WEB_DIR"
    VITE_APP_BASENAME=/dev/ \
    VITE_API_URL=/api-dev \
    VITE_SOCKET_URL=/events \
    VITE_SOCKET_PATH=/api-dev/socket.io \
    npm run build
  )

  [ -f "$WEB_DIST_DIR/index.html" ] || die "No se generó frontend en $WEB_DIST_DIR"

  log "Publicando frontend en $WEB_PUBLISH_DIR"
  rsync -a --delete "$WEB_DIST_DIR"/ "$WEB_PUBLISH_DIR"/
}

save_pm2() {
  log "Guardando estado PM2"
  pm2 save
}

show_summary() {
  log "Estado final"
  pm2 status
  printf '\nFrontend publicado en: %s\n' "$WEB_PUBLISH_DIR"
  printf 'Backend PM2: %s\n' "$PM2_NAME"
}

need_cmd git
need_cmd npm
need_cmd pm2
need_cmd rsync

case "$MODE" in
  all)
    update_repo
    deploy_backend
    deploy_web
    save_pm2
    show_summary
    ;;
  backend)
    update_repo
    deploy_backend
    save_pm2
    show_summary
    ;;
  web)
    update_repo
    deploy_web
    show_summary
    ;;
  local-all)
    deploy_backend
    deploy_web
    save_pm2
    show_summary
    ;;
  local-backend)
    deploy_backend
    save_pm2
    show_summary
    ;;
  local-web)
    deploy_web
    show_summary
    ;;
  *)
    cat <<'USAGE'
Uso:
  ./manual_update_dev.sh all
  ./manual_update_dev.sh backend
  ./manual_update_dev.sh web
  ./manual_update_dev.sh local-all
  ./manual_update_dev.sh local-backend
  ./manual_update_dev.sh local-web

Modos:
  all            -> git pull + backend + web + pm2 save
  backend        -> git pull + backend + pm2 save
  web            -> git pull + web
  local-all      -> sin git pull, backend + web + pm2 save
  local-backend  -> sin git pull, solo backend + pm2 save
  local-web      -> sin git pull, solo web
USAGE
    exit 1
    ;;
esac

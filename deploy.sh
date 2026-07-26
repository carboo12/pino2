#!/bin/bash
# Local deploy script — pulls latest from GitHub, rebuilds, and deploys
set -e

echo "=== Pulling latest from GitHub ==="
cd /opt/apps/pino2
git pull origin main

echo ""
echo "=== Backend ==="
cd /opt/apps/pino2/backend
npx tsc --noEmit
npm run build
pm2 restart pino-api-dev

echo ""
echo "=== Web (nginx) ==="
cd /opt/apps/pino2/web
npm run typecheck
VITE_APP_BASENAME=/dev/prueba/pino VITE_API_URL=/api-dev npx vite build --base=/dev/prueba/pino/
rm -rf /var/www/dev/prueba/pino/*
cp -r dist/* /var/www/dev/prueba/pino/

echo ""
echo "=== Web (Firebase) ==="
VITE_API_URL=https://rhclaroni.com/api-dev npx vite build
export GOOGLE_APPLICATION_CREDENTIALS=/opt/apps/pino2/web/firebase-service-account.json
npx firebase deploy --only hosting

echo ""
echo "✅ Deploy complete"

#!/bin/bash
# Auto-deploy: checks GitHub for new commits every minute
# Run via cron: * * * * * /opt/apps/pino2/auto-deploy.sh >> /var/log/pino-auto-deploy.log 2>&1

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export NODE_ENV=production

LOCKFILE=/tmp/pino-auto-deploy.lock
DEPLOY_LOG=/var/log/pino-auto-deploy.log
LAST_CHECK=/tmp/pino-last-commit.txt

# Skip if already running
[ -f "$LOCKFILE" ] && exit 0
touch "$LOCKFILE"

cd /opt/apps/pino2 || exit 1

# Get current local HEAD
LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "none")

# Fetch remote without merging
git fetch origin main 2>/dev/null || { rm -f "$LOCKFILE"; exit 1; }

# Get remote HEAD
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "none")

# Compare and skip if same
[ "$LOCAL" = "$REMOTE" ] && { rm -f "$LOCKFILE"; exit 0; }

# Skip if we already deployed this commit
[ -f "$LAST_CHECK" ] && [ "$(cat "$LAST_CHECK")" = "$REMOTE" ] && { rm -f "$LOCKFILE"; exit 0; }

echo "$(date) ========================================"
echo "$(date) New commit detected: $(git log --oneline -1 origin/main)"

# Pull
git pull origin main 2>&1 || { echo "$(date) ❌ Git pull failed"; rm -f "$LOCKFILE"; exit 1; }

NEW_COMMIT=$(git rev-parse HEAD)
echo "$NEW_COMMIT" > "$LAST_CHECK"

# Backend
echo "$(date) 🔧 Building backend..."
cd /opt/apps/pino2/backend
npx tsc --noEmit 2>&1 || echo "$(date) ⚠️  Backend typecheck had warnings"
npm run build 2>&1 || { echo "$(date) ❌ Backend build failed"; rm -f "$LOCKFILE"; exit 1; }
pm2 restart pino-api-dev 2>&1
echo "$(date) ✅ Backend deployed"

# Web (nginx)
echo "$(date) 🌐 Building web (nginx)..."
cd /opt/apps/pino2/web
npx tsc -p tsconfig.app.json --noEmit 2>&1 || { echo "$(date) ❌ Web typecheck failed"; rm -f "$LOCKFILE"; exit 1; }
VITE_APP_BASENAME=/dev/prueba/pino VITE_API_URL=/api-dev npx vite build --base=/dev/prueba/pino/ 2>&1 || { echo "$(date) ❌ Web build failed"; rm -f "$LOCKFILE"; exit 1; }
rm -rf /var/www/dev/prueba/pino/*
cp -r dist/* /var/www/dev/prueba/pino/
echo "$(date) ✅ Nginx deployed"

# Web (Firebase)
echo "$(date) 🔥 Building web (Firebase)..."
VITE_API_URL=https://rhclaroni.com/api-dev npx vite build 2>&1 || { echo "$(date) ❌ Firebase build failed"; rm -f "$LOCKFILE"; exit 1; }
export GOOGLE_APPLICATION_CREDENTIALS=/opt/apps/pino2/web/firebase-service-account.json
npx firebase deploy --only hosting 2>&1 || { echo "$(date) ❌ Firebase deploy failed"; rm -f "$LOCKFILE"; exit 1; }
echo "$(date) ✅ Firebase deployed"

# Verify
sleep 2
API_STATUS=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "https://rhclaroni.com/api-dev/health" 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin).get('status','FAIL'))" 2>/dev/null || echo "FAIL")
WEB_STATUS=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "https://rhclaroni.com/dev/prueba/pino/" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")

echo "$(date) ✅ API: $API_STATUS | Web: $WEB_STATUS"
echo "$(date) ========================================"

rm -f "$LOCKFILE"

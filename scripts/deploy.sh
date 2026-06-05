#!/bin/bash
set -e

DEPLOY_DIR="/var/www/clouddesktop"
echo "=== CloudDesktop Deploy: $(date) ==="

cd "$DEPLOY_DIR"

echo "--- Stashing any local server changes ---"
git stash || true

echo "--- Pulling latest code ---"
git pull origin main

echo "--- Installing backend dependencies ---"
cd "$DEPLOY_DIR/backend"
npm install --production

echo "--- Patching JWT expiry in .env ---"
if [ -f "$DEPLOY_DIR/backend/.env" ]; then
  sed -i 's/^JWT_EXPIRES_IN=.*/JWT_EXPIRES_IN=2h/' "$DEPLOY_DIR/backend/.env"
  grep -q '^JWT_EXPIRES_IN=' "$DEPLOY_DIR/backend/.env" || echo 'JWT_EXPIRES_IN=2h' >> "$DEPLOY_DIR/backend/.env"
fi

echo "--- Installing frontend dependencies ---"
cd "$DEPLOY_DIR/frontend"
npm install

echo "--- Building React frontend ---"
npm run build

echo "--- Restarting backend with PM2 (full restart to reload .env) ---"
cd "$DEPLOY_DIR/backend"
pm2 delete clouddesktop-api 2>/dev/null || true
pm2 start server.js --name clouddesktop-api
pm2 save

echo "--- Deploy complete ---"
pm2 status

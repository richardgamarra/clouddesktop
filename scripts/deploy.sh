#!/bin/bash
set -e

DEPLOY_DIR="/var/www/clouddesktop"
echo "=== CloudDesktop Deploy: $(date) ==="

cd "$DEPLOY_DIR"

echo "--- Pulling latest code ---"
git pull origin main

echo "--- Installing backend dependencies ---"
cd "$DEPLOY_DIR/backend"
npm install --production

echo "--- Installing frontend dependencies ---"
cd "$DEPLOY_DIR/frontend"
npm install

echo "--- Building React frontend ---"
npm run build
# Output goes to backend/public/ (set in vite.config.js)

echo "--- Restarting backend with PM2 ---"
cd "$DEPLOY_DIR/backend"
pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs

echo "--- Deploy complete ---"
pm2 status

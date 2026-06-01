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
pm2 restart clouddesktop-api --update-env || pm2 start server.js --name clouddesktop-api

echo "--- Deploy complete ---"
pm2 status

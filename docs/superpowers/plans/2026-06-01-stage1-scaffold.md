# CloudDesktop Workspace — Stage 1: Scaffold & Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full monorepo structure, configure Nginx + PM2 on the OVH server, create the PostgreSQL schema, and wire up GitHub Actions so every push to `main` auto-deploys to `clouddesktop.infoplay.com`.

**Architecture:** Monorepo with `frontend/` (React + Vite) and `backend/` (Node.js + Express). Nginx on port 443 serves the React build and reverse-proxies `/api/*` to Express on port 3001. PM2 keeps Express alive across reboots. GitHub Actions SSHes into OVH and runs the deploy script on every push to `main`.

**Tech Stack:** React 18, Vite 5, Node.js 20, Express 4, PostgreSQL 15, Nginx, PM2, GitHub Actions, node-postgres (`pg`), dotenv

---

## File Map

Files created in this stage:

```
clouddesktop/
├── .github/
│   └── workflows/
│       └── deploy.yml                  ← GitHub Actions CI/CD pipeline
├── frontend/
│   ├── package.json                    ← Vite + React deps
│   ├── vite.config.js                  ← Build output → ../backend/public
│   ├── index.html                      ← Vite HTML entry
│   └── src/
│       ├── main.jsx                    ← React root mount
│       └── App.jsx                     ← Placeholder app shell
├── backend/
│   ├── package.json                    ← Express + pg + dotenv deps
│   ├── server.js                       ← Express entry — serves /api + static
│   ├── ecosystem.config.cjs            ← PM2 process config
│   ├── .env.example                    ← Env var template (committed)
│   ├── .env                            ← Actual secrets (NOT committed)
│   └── db/
│       ├── pool.js                     ← PostgreSQL connection pool singleton
│       └── migrations/
│           └── 001_initial.sql         ← All 4 tables: users, subscriptions,
│                                          encrypted_settings, refresh_tokens
├── nginx/
│   └── clouddesktop.conf               ← Nginx server block config
├── scripts/
│   └── deploy.sh                       ← Deploy script run by GitHub Actions on server
└── .gitignore                          ← Root gitignore
```

---

## Task 1: Root repo cleanup & .gitignore

**Files:**
- Modify: `.gitignore` (root)

- [ ] **Step 1.1: Write root .gitignore**

```
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Build output
frontend/dist/
backend/public/

# Secrets
backend/.env
.env

# OS / editor
.DS_Store
Thumbs.db
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# Brainstorm sessions (not source)
.superpowers/
```

- [ ] **Step 1.2: Commit**

```bash
git add .gitignore
git commit -m "chore: add root .gitignore"
```

---

## Task 2: Frontend scaffold (React + Vite)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`

- [ ] **Step 2.1: Create `frontend/package.json`**

```json
{
  "name": "clouddesktop-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.2.12"
  }
}
```

- [ ] **Step 2.2: Create `frontend/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

> `outDir: '../backend/public'` puts the React build where Express serves static files from. The `proxy` makes local dev work without CORS.

- [ ] **Step 2.3: Create `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CloudDesktop Workspace</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2.4: Create `frontend/src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2.5: Create `frontend/src/App.jsx`**

```jsx
export default function App() {
  return (
    <div style={{
      background: '#0b0d12',
      color: '#e8eaf2',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        width: 52, height: 52,
        background: 'linear-gradient(135deg, #5b7fff, #a78bfa)',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, color: '#fff'
      }}>CW</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
        CloudDesktop Workspace
      </h1>
      <p style={{ color: '#8b90a8', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
        Stage 1 scaffold — deploy pipeline working ✓
      </p>
    </div>
  )
}
```

- [ ] **Step 2.6: Install frontend dependencies**

```bash
cd frontend && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 2.7: Verify dev server starts**

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` — should show the CW logo placeholder. Press `Ctrl+C` to stop.

- [ ] **Step 2.8: Verify build works**

```bash
npm run build
```

Expected: `../backend/public/` created with `index.html` and `assets/` inside.

- [ ] **Step 2.9: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: scaffold React + Vite frontend"
```

---

## Task 3: Backend scaffold (Node.js + Express)

**Files:**
- Create: `backend/package.json`
- Create: `backend/server.js`
- Create: `backend/.env.example`
- Create: `backend/.env` (local only — not committed)
- Create: `backend/db/pool.js`

- [ ] **Step 3.1: Create `backend/package.json`**

```json
{
  "name": "clouddesktop-backend",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.11.5",
    "dotenv": "^16.4.5",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "cookie-parser": "^1.4.6"
  }
}
```

- [ ] **Step 3.2: Create `backend/.env.example`**

```
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clouddesktop
DB_USER=clouddesktop_user
DB_PASSWORD=changeme

# Server
PORT=3001
NODE_ENV=production

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=changeme_generate_a_real_secret

# App
APP_URL=https://clouddesktop.infoplay.com
```

- [ ] **Step 3.3: Create `backend/.env` (local dev — never committed)**

Copy `.env.example` to `.env` and fill in your local PostgreSQL credentials:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clouddesktop
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password
PORT=3001
NODE_ENV=development
JWT_SECRET=dev_secret_replace_in_production
APP_URL=http://localhost:3001
```

- [ ] **Step 3.4: Create `backend/db/pool.js`**

```js
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err)
})

module.exports = pool
```

- [ ] **Step 3.5: Create `backend/server.js`**

```js
require('dotenv').config()
const express = require('express')
const path    = require('path')
const helmet  = require('helmet')
const cors    = require('cors')
const cookieParser = require('cookie-parser')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Security middleware ──────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // configured properly in Stage 3
}))
app.use(cors({
  origin: process.env.APP_URL,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// ── Health check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Serve React build (production) ───────────────────
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public')
  app.use(express.static(publicDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`CloudDesktop backend running on port ${PORT} [${process.env.NODE_ENV}]`)
})

module.exports = app
```

- [ ] **Step 3.6: Install backend dependencies**

```bash
cd backend && npm install
```

- [ ] **Step 3.7: Verify backend starts**

```bash
npm run dev
```

Expected:
```
CloudDesktop backend running on port 3001 [development]
```

- [ ] **Step 3.8: Test health endpoint**

Open a new terminal:
```bash
curl http://localhost:3001/api/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-06-01T..."}
```

Press `Ctrl+C` to stop the backend.

- [ ] **Step 3.9: Commit**

```bash
cd ..
git add backend/
git commit -m "feat: scaffold Node.js + Express backend"
```

---

## Task 4: PM2 config

**Files:**
- Create: `backend/ecosystem.config.cjs`

- [ ] **Step 4.1: Create `backend/ecosystem.config.cjs`**

```js
module.exports = {
  apps: [
    {
      name: 'clouddesktop-api',
      script: 'server.js',
      cwd: '/var/www/clouddesktop/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/pm2/clouddesktop-error.log',
      out_file:   '/var/log/pm2/clouddesktop-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
```

- [ ] **Step 4.2: Commit**

```bash
git add backend/ecosystem.config.cjs
git commit -m "chore: add PM2 ecosystem config"
```

---

## Task 5: Database migration SQL

**Files:**
- Create: `backend/db/migrations/001_initial.sql`
- Create: `backend/db/migrate.js`

- [ ] **Step 5.1: Create `backend/db/migrations/001_initial.sql`**

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('free', 'premium', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               VARCHAR(255) NOT NULL UNIQUE,
  password_hash       TEXT,
  role                user_role   NOT NULL DEFAULT 'free',
  email_verified      BOOLEAN     NOT NULL DEFAULT false,
  stripe_customer_id  VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── subscriptions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                    VARCHAR(20) NOT NULL CHECK (plan IN ('monthly', 'annual')),
  stripe_subscription_id  VARCHAR(255) NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_end      TIMESTAMPTZ NOT NULL,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ── encrypted_settings ────────────────────────────────
CREATE TABLE IF NOT EXISTS encrypted_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  encrypted_blob  TEXT        NOT NULL,
  iv              TEXT        NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── refresh_tokens ────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN     NOT NULL DEFAULT false,
  user_agent  TEXT,
  ip          VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ── announcements (admin broadcast) ───────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message     TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 5.2: Create `backend/db/migrate.js`**

This script reads the SQL file and runs it against the database:

```js
require('dotenv').config()
const fs   = require('fs')
const path = require('path')
const pool = require('./pool')

async function migrate() {
  const sqlPath = path.join(__dirname, 'migrations', '001_initial.sql')
  const sql     = fs.readFileSync(sqlPath, 'utf8')

  console.log('Running migration: 001_initial.sql ...')
  try {
    await pool.query(sql)
    console.log('Migration complete.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
```

- [ ] **Step 5.3: Run migration locally**

Make sure your local PostgreSQL is running and `backend/.env` has correct credentials, then:

```bash
cd backend
# Create the database first if it doesn't exist
psql -U postgres -c "CREATE DATABASE clouddesktop;"
psql -U postgres -c "CREATE USER clouddesktop_user WITH PASSWORD 'changeme';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE clouddesktop TO clouddesktop_user;"

# Run the migration
node db/migrate.js
```

Expected:
```
Running migration: 001_initial.sql ...
Migration complete.
```

- [ ] **Step 5.4: Verify tables were created**

```bash
psql -U postgres -d clouddesktop -c "\dt"
```

Expected output:
```
              List of relations
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | announcements         | table | postgres
 public | encrypted_settings    | table | postgres
 public | refresh_tokens        | table | postgres
 public | subscriptions         | table | postgres
 public | users                 | table | postgres
```

- [ ] **Step 5.5: Commit**

```bash
cd ..
git add backend/db/
git commit -m "feat: add PostgreSQL schema migration (4 tables + announcements)"
```

---

## Task 6: Nginx configuration

**Files:**
- Create: `nginx/clouddesktop.conf`

- [ ] **Step 6.1: Create `nginx/clouddesktop.conf`**

```nginx
# CloudDesktop Workspace — Nginx server block
# Deploy to: /etc/nginx/sites-available/clouddesktop
# Then: ln -s /etc/nginx/sites-available/clouddesktop /etc/nginx/sites-enabled/

server {
    listen 80;
    server_name clouddesktop.infoplay.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name clouddesktop.infoplay.com;

    # SSL — certificates already configured on server
    ssl_certificate     /etc/letsencrypt/live/clouddesktop.infoplay.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clouddesktop.infoplay.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Serve React build (static files)
    root /var/www/clouddesktop/backend/public;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Proxy /api/* to Express backend on port 3001
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # React SPA — send all non-file routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

- [ ] **Step 6.2: Commit**

```bash
git add nginx/
git commit -m "chore: add Nginx server block config"
```

---

## Task 7: Deploy script

**Files:**
- Create: `scripts/deploy.sh`

- [ ] **Step 7.1: Create `scripts/deploy.sh`**

This script runs **on the OVH server** during each GitHub Actions deploy:

```bash
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
```

- [ ] **Step 7.2: Make it executable and commit**

```bash
chmod +x scripts/deploy.sh
git add scripts/
git commit -m "chore: add server deploy script"
```

---

## Task 8: One-time server setup

This task runs **once manually** via SSH to prepare the OVH server. You only do this once.

- [ ] **Step 8.1: SSH into OVH server**

```bash
ssh -p 2222 root@clouddesktop.infoplay.com
```

- [ ] **Step 8.2: Install Node.js 20 via nvm**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node --version   # should print v20.x.x
```

- [ ] **Step 8.3: Install PM2 globally**

```bash
npm install -g pm2
pm2 startup systemd -u root --hp /root
# Run the command it outputs to enable PM2 on boot
```

- [ ] **Step 8.4: Create app directory and clone repo**

```bash
mkdir -p /var/www/clouddesktop
cd /var/www/clouddesktop
git clone https://github.com/YOUR_GITHUB_USERNAME/clouddesktop.git .
```

> Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

- [ ] **Step 8.5: Create the .env file on server**

```bash
cp /var/www/clouddesktop/backend/.env.example /var/www/clouddesktop/backend/.env
nano /var/www/clouddesktop/backend/.env
```

Fill in real values:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clouddesktop
DB_USER=clouddesktop_user
DB_PASSWORD=YOUR_REAL_DB_PASSWORD
PORT=3001
NODE_ENV=production
JWT_SECRET=GENERATE_WITH_node_-e_"console.log(require('crypto').randomBytes(64).toString('hex'))"
APP_URL=https://clouddesktop.infoplay.com
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- [ ] **Step 8.6: Create PostgreSQL database and user**

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE clouddesktop;
CREATE USER clouddesktop_user WITH PASSWORD 'YOUR_REAL_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE clouddesktop TO clouddesktop_user;
GRANT ALL ON SCHEMA public TO clouddesktop_user;
EOF
```

- [ ] **Step 8.7: Run migration on server**

```bash
cd /var/www/clouddesktop/backend
npm install
node db/migrate.js
```

Expected:
```
Running migration: 001_initial.sql ...
Migration complete.
```

- [ ] **Step 8.8: Build frontend and start backend**

```bash
cd /var/www/clouddesktop/frontend
npm install
npm run build

cd /var/www/clouddesktop/backend
pm2 start ecosystem.config.cjs
pm2 save
```

Expected:
```
[PM2] Spawning PM2 daemon...
[PM2] PM2 Successfully daemonized
┌─────┬──────────────────────┬─────────┬──────┬───────────┬──────────┬──────────┐
│ id  │ name                 │ mode    │ ↺    │ status    │ cpu      │ memory   │
├─────┼──────────────────────┼─────────┼──────┼───────────┼──────────┼──────────┤
│ 0   │ clouddesktop-api     │ fork    │ 0    │ online    │ 0%       │ 40mb     │
└─────┴──────────────────────┴─────────┴──────┴───────────┴──────────┴──────────┘
```

- [ ] **Step 8.9: Install Nginx config**

```bash
cp /var/www/clouddesktop/nginx/clouddesktop.conf /etc/nginx/sites-available/clouddesktop
ln -sf /etc/nginx/sites-available/clouddesktop /etc/nginx/sites-enabled/clouddesktop

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

nginx -t   # Must print: syntax is ok / test is successful
systemctl reload nginx
```

- [ ] **Step 8.10: Verify site is live**

Open `https://clouddesktop.infoplay.com` in your browser.

Expected: CW logo placeholder page with "Stage 1 scaffold — deploy pipeline working ✓"

Also test the API:
```bash
curl https://clouddesktop.infoplay.com/api/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-06-01T..."}
```

---

## Task 9: GitHub Actions deploy pipeline

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 9.1: Generate an SSH deploy key (run on your local machine)**

```bash
ssh-keygen -t ed25519 -C "github-actions-clouddesktop" -f ~/.ssh/clouddesktop_deploy -N ""
```

This creates two files:
- `~/.ssh/clouddesktop_deploy` — private key (goes into GitHub Secrets)
- `~/.ssh/clouddesktop_deploy.pub` — public key (goes on OVH server)

- [ ] **Step 9.2: Add public key to OVH server**

```bash
ssh -p 2222 root@clouddesktop.infoplay.com \
  "echo '$(cat ~/.ssh/clouddesktop_deploy.pub)' >> ~/.ssh/authorized_keys"
```

- [ ] **Step 9.3: Add secrets to GitHub**

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

| Secret name | Value |
|---|---|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/clouddesktop_deploy` (the private key file) |
| `SSH_HOST` | `clouddesktop.infoplay.com` |
| `SSH_PORT` | `2222` |

- [ ] **Step 9.4: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to OVH

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to clouddesktop.infoplay.com
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add server to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Run deploy script on server
        run: |
          ssh -p ${{ secrets.SSH_PORT }} root@${{ secrets.SSH_HOST }} \
            "bash /var/www/clouddesktop/scripts/deploy.sh"
```

- [ ] **Step 9.5: Commit and push to trigger first deploy**

```bash
git add .github/
git commit -m "feat: add GitHub Actions deploy pipeline"
git push origin main
```

- [ ] **Step 9.6: Watch the deploy run**

Go to your GitHub repo → **Actions** tab.

You should see a workflow run called "Deploy to OVH" in progress. It will:
1. SSH into OVH
2. `git pull`
3. `npm install` (backend + frontend)
4. `npm run build` (frontend → backend/public)
5. `pm2 restart`

Expected: green checkmark ✓ within ~2 minutes.

- [ ] **Step 9.7: Verify after deploy**

Visit `https://clouddesktop.infoplay.com` — page should load. Run:

```bash
curl https://clouddesktop.infoplay.com/api/health
```

Expected:
```json
{"status":"ok","timestamp":"..."}
```

---

## Task 10: Smoke test checklist

Run these checks to confirm Stage 1 is complete:

- [ ] `https://clouddesktop.infoplay.com` loads the CW placeholder page
- [ ] `https://clouddesktop.infoplay.com/api/health` returns `{"status":"ok"}`
- [ ] `https://clouddesktop.infoplay.com/any-route` returns the React page (SPA routing works)
- [ ] `http://clouddesktop.infoplay.com` redirects to `https://` (301)
- [ ] PM2 shows `clouddesktop-api` as `online` on server (`pm2 status`)
- [ ] Push a small change to `main` → GitHub Actions deploys automatically
- [ ] PostgreSQL has all 5 tables: `users`, `subscriptions`, `encrypted_settings`, `refresh_tokens`, `announcements`

- [ ] **Final commit: update README**

Create `README.md` in repo root:

```markdown
# CloudDesktop Workspace

Productivity hub at [clouddesktop.infoplay.com](https://clouddesktop.infoplay.com)

## Stack
- **Frontend:** React 18 + Vite 5
- **Backend:** Node.js 20 + Express 4
- **Database:** PostgreSQL 15
- **Server:** OVH bare metal · Nginx · PM2
- **Deploy:** GitHub Actions → SSH on push to `main`

## Local development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Frontend dev server: http://localhost:5173  
Backend API: http://localhost:3001

## Deploy
Push to `main` — GitHub Actions handles the rest.
```

```bash
git add README.md
git commit -m "docs: add README for Stage 1"
git push origin main
```

---

## Stage 1 Complete

All infrastructure is live. Next: **Stage 2 — Auth system** (signup, login, JWT, email verification, password reset).

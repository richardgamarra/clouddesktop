---
name: project-clouddesktop
description: "CloudDesktop Workspace SaaS project — infrastructure, server details, and stage progress"
metadata: 
  node_type: memory
  type: project
  originSessionId: c1af67ff-dfc5-4333-bc9c-c7eb04d81052
---

CloudDesktop Workspace is a SaaS productivity hub live at clouddesktop.infoplay.com.

**How to apply:** Use this context when making infrastructure decisions, port choices, or deployment changes.

## Live URL
https://clouddesktop.infoplay.com

## Admin
- Admin panel: https://clouddesktop.infoplay.com/admin
- Admin account: richardgamarra@gmail.com (role=admin, email_verified=true in DB)

## Server
- OVH bare metal, root access, SSH port 2222
- Plesk manages nginx vhosts — our custom config wins because it loads before Plesk's zz010 include
- Our nginx config: `/etc/nginx/conf.d/clouddesktop-infoplay-com.conf`
- SSL cert: `/opt/psa/var/certificates/scfvpo1itinp1la4l6kiGt`

## App
- Backend Express app runs on **port 4010** (not 3001 — PM2 v6 Go daemon holds 3001 internally)
- PM2 process name: `clouddesktop-api`
- Deploy dir: `/var/www/clouddesktop/`
- React build output: `/var/www/clouddesktop/backend/public/`
- .env location: `/var/www/clouddesktop/backend/.env` (not committed)
- DB password: CloudDesktop2026!
- DB name: clouddesktop, user: clouddesktop_user, host: 127.0.0.1

## News RSS
- Server-side proxy at `/api/news/fetch?url=...` (backend/routes/news.js)
- CNN/Reuters/ESPN blocked by OVH IPs — do not use
- Working sources: BBC, The Guardian, Al Jazeera, TechCrunch, Hacker News, NY Times

## Port inventory (taken ports to avoid)
3001 (PM2 Go daemon), 3002 (GitHub Actions runner), 3000, 3003, 3030,
3800 (arequipa-net), 3900, 4000, 4002, 4190, 4200, 4201, 5432 (PostgreSQL),
5678/5679 (n8n), 7080/7081 (Plesk Apache), 8000-8891, 10000 (Plesk panel), 27017 (MongoDB)
**Our port: 4010**

## CI/CD
- GitHub: github.com/richardgamarra/clouddesktop
- GitHub Actions: push to main → SSH deploy → runs scripts/deploy.sh (includes git stash)
- SSH key: /root/.ssh/clouddesktop_deploy
- GitHub Secrets: SSH_PRIVATE_KEY, SSH_HOST, SSH_PORT

## Stages completed
- ✅ Stage 1: Scaffold, Nginx, PM2, GitHub Actions, PostgreSQL migration
- ✅ Stage 2: Auth (signup, login, JWT, refresh tokens, email verify, password reset)
- ✅ Stage 3: Landing page + login/signup/forgot-password React pages
- ✅ Stage 4: Dashboard (full React migration from index.html — news + apps tabs, sidebar, modals, drag-reorder)
- ✅ Stage 8: Admin panel (users, stats, broadcast announcement)
- ✅ News RSS fixes: server-side proxy, source edit/reorder/image toggle, uniform card grid

## Stages remaining
- Stage 5: Custom tabs (+ button → Web Page, Bookmarks, Notes, World Clock, Weather) — plan written
- Stage 6: Stripe billing (pricing page, checkout, webhooks) — plan not written
- Stage 7: Encrypted cloud sync — plan not written
- Stage 9: Polish

## Key localStorage keys (browser)
- wsh_groups, wsh_apps — app groups and apps
- wsh_news_sources — news feed sources (clear to reset to defaults)
- wsh_custom_tabs — custom tabs (Stage 5)

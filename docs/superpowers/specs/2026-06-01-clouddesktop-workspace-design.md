# CloudDesktop Workspace — Full Product Design Spec
**Date:** 2026-06-01  
**Status:** Approved — ready for implementation planning

---

## 1. Overview

CloudDesktop Workspace is a hosted SaaS productivity hub at `clouddesktop.infoplay.com`. Users sign in, get a personal dashboard to launch web apps and read news, and can upgrade to Premium for encrypted cloud sync. An Admin panel manages users and plans.

The existing `index.html` prototype is migrated into a full React + Node.js application deployed on an OVH bare metal server.

---

## 2. Infrastructure & Deployment

| Component | Technology |
|---|---|
| Server | OVH bare metal · root access · port 2222 |
| Domain | clouddesktop.infoplay.com · SSL already configured |
| Reverse proxy | Nginx — serves React static files, proxies `/api/*` to Express |
| Backend process manager | PM2 — keeps Node.js alive |
| Database | PostgreSQL — already installed on OVH server |
| Frontend | React + Vite — built to `/var/www/clouddesktop/dist` |
| Backend | Node.js + Express — runs on port 3001 internally |
| CI/CD | GitHub Actions → SSH deploy on push to `main` |
| Repo structure | Monorepo: `frontend/` + `backend/` in one GitHub repo |

### Nginx routing
- `GET /` and all non-API routes → serve `dist/index.html` (React SPA)
- `GET /api/*` → proxy to `localhost:3001`

### GitHub Actions deploy pipeline
1. Push to `main`
2. SSH into OVH server
3. `git pull`, `npm install`, `npm run build` (frontend), `pm2 restart` (backend)

---

## 3. Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| password_hash | TEXT | bcrypt, cost 12 |
| role | ENUM(free, premium, admin) | default: free |
| email_verified | BOOLEAN | default: false |
| stripe_customer_id | VARCHAR | nullable |
| created_at | TIMESTAMPTZ | |
| last_login_at | TIMESTAMPTZ | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| plan | ENUM(monthly, annual) | |
| stripe_subscription_id | VARCHAR | |
| status | VARCHAR | active, cancelled, past_due |
| current_period_end | TIMESTAMPTZ | |
| cancelled_at | TIMESTAMPTZ | nullable |

### `encrypted_settings`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | UNIQUE |
| encrypted_blob | TEXT | AES-256-GCM ciphertext, base64 |
| iv | TEXT | initialization vector, base64 |
| updated_at | TIMESTAMPTZ | |

> **Privacy guarantee:** The server stores the encrypted blob as an opaque string. The encryption key is derived from the user's password client-side (PBKDF2) and never sent to the server. The server cannot decrypt the blob.

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| token_hash | TEXT | SHA-256 of the raw token |
| expires_at | TIMESTAMPTZ | 30 days |
| revoked | BOOLEAN | default: false |
| user_agent | TEXT | |
| ip | VARCHAR | |
| created_at | TIMESTAMPTZ | |

---

## 4. Authentication

- **JWT access tokens** — short-lived (15 min), signed with RS256, stored in memory (not localStorage)
- **Refresh tokens** — long-lived (30 days), stored in `HttpOnly` cookie, hashed in DB
- **Password hashing** — bcrypt cost 12
- **Email verification** — token sent on signup, must verify before login
- **Password reset** — time-limited token (1 hour) sent by email
- **Google OAuth** — optional Sign in with Google via OAuth 2.0

---

## 5. Branding & Design

- **Product name:** CloudDesktop Workspace
- **Domain:** clouddesktop.infoplay.com
- **Font:** Plus Jakarta Sans (headings + UI) · DM Mono (monospace labels)
- **Theme:** Dark — bg `#0b0d12`, accent `#5b7fff` (blue), secondary `#a78bfa` (purple)
- **Logo mark:** "CW" initials in a gradient pill

---

## 6. Pages & Routes

### Public (unauthenticated)
| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login form (also accessible via landing page hero login card) |
| `/signup` | Registration form |
| `/reset-password` | Request password reset |
| `/reset-password/:token` | Set new password |
| `/pricing` | Pricing page (also section on landing page) |
| `/verify-email/:token` | Email verification |

### Protected (any logged-in user)
| Route | Description |
|---|---|
| `/dashboard` | Main CloudDesktop Workspace app |
| `/profile` | Change name, email, password |
| `/settings` | Import/export settings, theme |
| `/billing` | Stripe billing portal, upgrade/downgrade |

### Admin only
| Route | Description |
|---|---|
| `/admin/users` | User list, search, filter, edit role |
| `/admin/stats` | Total users, premium %, active today |
| `/admin/broadcast` | Send announcement banner to all users |

---

## 7. Landing Page

Single-page layout, scrollable sections:

1. **Sticky nav** — Logo "CW · CloudDesktop Workspace", links (Features, News, Pricing), Log in button, Get started free button
2. **Hero** — Two-column layout:
   - Left: headline, sub-copy, two CTA buttons ("Start for free →", "See demo"), "No credit card required" note
   - Right: Login card (email + password fields, Google OAuth button, forgot password, sign up link)
3. **Features grid** — 6 cards: App Launcher, Live News Feed, App Groups, Keyboard Shortcuts, Private by Design, Cloud Sync
4. **News preview** — Sample card layout (hero card + 2 smaller cards) showing the news reader
5. **Pricing** — 3 tiers: Free ($0), Premium ($4.99/mo or $39.99/yr), Enterprise (contact)
6. **Footer** — Copyright, Privacy, Terms, Contact

---

## 8. Dashboard App

The dashboard is the migrated `index.html` rebuilt as React components.

### Tab bar
- **Fixed tabs:** 📰 News · ⚡ Apps
- **Custom tabs:** added by user via `+` button, closeable with `×`, reorderable by drag
- **Tab types available when adding:**
  - 🌐 Web Page — embed any public URL
  - 📰 News Feed — dedicated tab for one RSS source
  - 🔖 Bookmarks — quick-launch link grid
  - 🌦️ Weather — live forecast widget (set city)
  - 📝 Notes — persistent scratch pad, auto-saves locally
  - 🕐 World Clock — multiple timezone clocks

### News Tab
- Cards grid per RSS source (hero card + 4 smaller)
- Source filter pills
- Add/remove sources modal with presets
- Refresh button
- Sources persisted to user's encrypted settings

### Apps Tab
- Sidebar (72px) with icon buttons per app, grouped by color
- Main area: dashboard card grid organized by group
- App cards: icon, name, URL, shortcut, open/closed status
- Right-click context menu: Edit, Change icon, Set shortcut, Move to group, Delete
- Full edit modal: name, URL, group, icon picker (emoji grid + custom URL), keyboard shortcut recorder
- Group manager: create, rename, recolor, reorder, delete
- "Open All" button launches all apps in named browser tabs
- Drag-to-reorder within groups

### Custom Tab Types
- **Web Page:** renders URL in a `<iframe>` with blocked-embed fallback (open in new tab)
- **Bookmarks:** simple grid of links with favicon icons, add/remove
- **Weather:** OpenWeatherMap API widget, city setting stored in tab config
- **Notes:** `<textarea>` auto-saved to localStorage under tab ID
- **World Clock:** list of cities with live time, add/remove cities
- **News Feed:** same card layout as main News tab but for one source

---

## 9. User Roles & Plan Limits

| Feature | Free | Premium | Admin |
|---|---|---|---|
| App groups | 2 | Unlimited | Unlimited |
| Apps | 10 | Unlimited | Unlimited |
| News sources | 3 | Unlimited | Unlimited |
| Custom tabs | 2 | Unlimited | Unlimited |
| Cloud sync (encrypted) | ✗ | ✓ | ✓ |
| Import / Export settings | ✓ | ✓ | ✓ |
| Custom themes | ✗ | ✓ | ✓ |
| Admin panel access | ✗ | ✗ | ✓ |

---

## 10. Pricing

| Plan | Price | Billing |
|---|---|---|
| Free | $0 | — |
| Premium Monthly | $4.99 | Stripe recurring monthly |
| Premium Annual | $39.99 | Stripe recurring annual (~33% discount) |
| Enterprise | Contact | Custom |

Stripe webhooks update `subscriptions` table on payment, cancellation, and renewal events.

---

## 11. Settings Encryption (Client-Side)

1. On login, derive encryption key: `PBKDF2(password, user_id, 100000 iterations, SHA-256) → 256-bit key`
2. Serialize settings to JSON
3. Encrypt: `AES-256-GCM(key, settings_json) → {ciphertext, iv}`
4. Upload `{encrypted_blob, iv}` to `POST /api/settings/sync`
5. On load, download blob, decrypt with derived key, hydrate app state

The server receives and stores only the ciphertext. The key never leaves the browser.

---

## 12. Admin Panel

- **User list** — paginated table: email, role, plan, created date, last login, action buttons
- **Search/filter** — by email, role, plan status
- **Edit user** — change role (free/premium/admin), send password reset email, deactivate account
- **Stats dashboard** — total users, premium count, active today, MRR estimate
- **Broadcast** — text input → saves announcement shown as banner to all users on next load

---

## 13. API Endpoints (Express)

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET  /api/auth/verify-email/:token`
- `GET  /api/auth/google` + `GET /api/auth/google/callback`

### User
- `GET  /api/user/me`
- `PUT  /api/user/profile`
- `PUT  /api/user/password`

### Settings
- `GET  /api/settings`
- `PUT  /api/settings/sync`

### Billing
- `POST /api/billing/create-checkout`
- `GET  /api/billing/portal`
- `POST /api/billing/webhook` (Stripe webhook)

### Admin
- `GET  /api/admin/users`
- `PUT  /api/admin/users/:id`
- `GET  /api/admin/stats`
- `POST /api/admin/broadcast`

---

## 14. Implementation Stages

| Stage | Scope |
|---|---|
| 1 | Project scaffold · Nginx + PM2 setup · GitHub Actions deploy pipeline · DB schema migrations |
| 2 | Auth system — signup, login, JWT, refresh tokens, email verify, password reset |
| 3 | Landing page (React) · Login/Signup pages |
| 4 | Dashboard — migrate index.html to React components (News tab + Apps tab) |
| 5 | Custom tabs feature (+ button, 6 tab types) |
| 6 | Stripe integration — pricing page, checkout, webhooks, billing portal |
| 7 | Encrypted cloud sync — client-side AES, settings API, import/export |
| 8 | Admin panel — user management, stats, broadcast |
| 9 | Polish — onboarding wizard, themes (Premium), keyboard shortcut cheatsheet |

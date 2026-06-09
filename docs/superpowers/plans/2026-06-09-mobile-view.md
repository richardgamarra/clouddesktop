# Mobile View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a touch-friendly mobile UI at `/mobile` with bottom tab bar, icon grid launcher, bookmarks list, and PWA manifest — zero changes to the existing desktop view.

**Architecture:** New `frontend/src/mobile/` folder with self-contained components that reuse existing hooks (`useHubState`, `useAuth`) and modals (`AppModal`, `ConfirmModal`). Mobile redirect added to `LoginPage.jsx` after login. New `/mobile` route added to `App.jsx`.

**Tech Stack:** React 18, React Router v6, CSS custom properties (existing theme vars), HTML5 touch events, no new libraries.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `frontend/public/manifest.json` | PWA manifest |
| Modify | `frontend/index.html` | Add PWA meta tags + manifest link |
| Create | `frontend/src/mobile/mobile.css` | Mobile layout styles |
| Create | `frontend/src/mobile/TopBar.jsx` | Fixed top bar (logo + logout) |
| Create | `frontend/src/mobile/BottomTabBar.jsx` | Fixed bottom nav (5 tabs) |
| Create | `frontend/src/mobile/MobileAppsTab.jsx` | Icon grid + long-press action sheet |
| Create | `frontend/src/mobile/MobileBookmarksTab.jsx` | Bookmarks list + swipe-to-reveal |
| Create | `frontend/src/mobile/MobileSettingsTab.jsx` | Theme toggle + logout + desktop link |
| Create | `frontend/src/mobile/MobileDashboard.jsx` | Top-level page, wires all tabs |
| Modify | `frontend/src/App.jsx` | Add `/mobile` route |
| Modify | `frontend/src/pages/LoginPage.jsx` | Auto-redirect mobile users to `/mobile` |

---

## Task 1: PWA Manifest + index.html meta tags

**Files:**
- Create: `frontend/public/manifest.json`
- Modify: `frontend/index.html`

- [ ] **Step 1: Create manifest.json**

Create `frontend/public/manifest.json`:

```json
{
  "name": "CloudDesktop",
  "short_name": "CloudDesktop",
  "description": "Your personal cloud workspace",
  "start_url": "/mobile",
  "display": "standalone",
  "background_color": "#0b0d12",
  "theme_color": "#0b0d12",
  "icons": [
    { "src": "/logo.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/logo.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Add PWA meta tags to index.html**

Replace the existing `<head>` block in `frontend/index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CloudDesktop Workspace</title>
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0b0d12" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="CloudDesktop" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Verify manifest loads**

Run `npm run dev` in `frontend/`. Open browser DevTools → Application → Manifest. Confirm "CloudDesktop" name, `start_url: /mobile`, and `display: standalone` appear.

- [ ] **Step 4: Commit**

```bash
git add frontend/public/manifest.json frontend/index.html
git commit -m "feat(pwa): add manifest.json and PWA meta tags"
```

---

## Task 2: Mobile CSS

**Files:**
- Create: `frontend/src/mobile/mobile.css`

- [ ] **Step 1: Create the mobile CSS file**

Create `frontend/src/mobile/mobile.css`:

```css
/* ── Mobile shell ─────────────────────────────────────────────────────────── */
.mobile-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;           /* dynamic viewport height — handles mobile browser chrome */
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
  position: relative;
}

/* ── Top bar ──────────────────────────────────────────────────────────────── */
.m-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.m-topbar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.m-topbar-logo span {
  font-size: 20px;
}

.m-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.m-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-logout-btn {
  background: none;
  border: 1px solid var(--border2);
  border-radius: 8px;
  color: var(--text2);
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  padding: 5px 10px;
  cursor: pointer;
}

/* ── Content area ─────────────────────────────────────────────────────────── */
.m-content {
  position: fixed;
  top: 52px;
  left: 0;
  right: 0;
  bottom: calc(60px + env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 12px;
}

/* ── Bottom tab bar ───────────────────────────────────────────────────────── */
.m-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(60px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: stretch;
  z-index: 100;
}

.m-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  color: var(--text3);
  font-size: 10px;
  font-weight: 600;
  min-height: 44px;
  border: none;
  background: none;
  padding: 0;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.m-tab-item.active {
  color: var(--accent);
}

.m-tab-item .m-tab-icon {
  font-size: 20px;
  line-height: 1;
}

.m-tab-item.active .m-tab-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  margin-top: 2px;
}

/* ── Apps tab ─────────────────────────────────────────────────────────────── */
.m-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: 'DM Mono', monospace;
}

.m-group-header:first-child {
  margin-top: 0;
}

.m-group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.m-app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.m-app-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s;
  user-select: none;
}

.m-app-cell:active {
  background: var(--s3);
}

.m-app-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
}

.m-app-icon-emoji {
  font-size: 40px;
  line-height: 52px;
  display: block;
  text-align: center;
  width: 52px;
  height: 52px;
}

.m-app-name {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  max-width: 68px;
}

.m-add-app-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 2px dashed var(--border2);
  border-radius: 10px;
  color: var(--text3);
  font-size: 12px;
  cursor: pointer;
  margin-bottom: 4px;
  -webkit-tap-highlight-color: transparent;
}

.m-add-app-row:active {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Long-press action sheet ──────────────────────────────────────────────── */
.m-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.m-sheet {
  width: 100%;
  background: var(--s2);
  border-radius: 16px 16px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  animation: slideUp 0.22s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.m-sheet-title {
  padding: 16px 20px 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text2);
  border-bottom: 1px solid var(--border);
  font-family: 'DM Mono', monospace;
}

.m-sheet-action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  height: 52px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--text);
  width: 100%;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.m-sheet-action:active {
  background: var(--s3);
}

.m-sheet-action.danger {
  color: var(--red);
}

.m-sheet-action.cancel {
  color: var(--text3);
  border-top: 1px solid var(--border);
}

/* ── Bookmarks tab ────────────────────────────────────────────────────────── */
.m-bm-add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 16px;
  cursor: pointer;
  margin-bottom: 16px;
  -webkit-tap-highlight-color: transparent;
}

.m-bm-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-bm-row-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
}

.m-bm-actions-bg {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
}

.m-bm-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
}

.m-bm-action-btn.edit  { background: var(--accent); }
.m-bm-action-btn.delete { background: var(--red); }

.m-bm-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s ease;
  position: relative;
  z-index: 1;
}

.m-bm-row:active {
  background: var(--s2);
}

.m-bm-favicon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.m-bm-info { flex: 1; min-width: 0; }

.m-bm-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.m-bm-domain {
  font-size: 11px;
  color: var(--text3);
  font-family: 'DM Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Settings tab ─────────────────────────────────────────────────────────── */
.m-settings-section {
  background: var(--surface);
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.m-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.m-settings-row:last-child {
  border-bottom: none;
}

.m-settings-label {
  font-weight: 600;
  color: var(--text);
}

.m-settings-value {
  font-size: 12px;
  color: var(--text3);
  font-family: 'DM Mono', monospace;
}

.m-settings-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--adim);
  color: var(--accent);
  border-radius: 6px;
  padding: 2px 8px;
  font-family: 'DM Mono', monospace;
}

.m-theme-toggle {
  display: flex;
  border: 1px solid var(--border2);
  border-radius: 8px;
  overflow: hidden;
}

.m-theme-btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: none;
  color: var(--text3);
  transition: background 0.15s, color 0.15s;
}

.m-theme-btn.active {
  background: var(--accent);
  color: #fff;
}

.m-logout-full-btn {
  width: 100%;
  padding: 14px;
  background: var(--reddim);
  color: var(--red);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 12px;
  -webkit-tap-highlight-color: transparent;
}

.m-desktop-link {
  display: block;
  text-align: center;
  color: var(--text3);
  font-size: 12px;
  font-family: 'DM Mono', monospace;
  padding: 10px;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
}

/* ── News / Notes passthrough padding ─────────────────────────────────────── */
.m-tab-passthrough {
  min-height: 100%;
}
```

- [ ] **Step 2: Verify file saved (no run needed — CSS only)**

Open `frontend/src/mobile/mobile.css` and confirm it exists.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/mobile/mobile.css
git commit -m "feat(mobile): add mobile CSS layout and component styles"
```

---

## Task 3: TopBar component

**Files:**
- Create: `frontend/src/mobile/TopBar.jsx`

- [ ] **Step 1: Create TopBar.jsx**

Create `frontend/src/mobile/TopBar.jsx`:

```jsx
export default function TopBar({ user, onLogout }) {
  const initial = (user?.email || '?')[0].toUpperCase()

  return (
    <div className="m-topbar">
      <div className="m-topbar-logo">
        <span>☁</span>
        CloudDesktop
      </div>
      <div className="m-topbar-right">
        <div className="m-avatar" title={user?.email}>{initial}</div>
        <button className="m-logout-btn" onClick={onLogout}>Log out</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/mobile/TopBar.jsx
git commit -m "feat(mobile): add TopBar component"
```

---

## Task 4: BottomTabBar component

**Files:**
- Create: `frontend/src/mobile/BottomTabBar.jsx`

- [ ] **Step 1: Create BottomTabBar.jsx**

Create `frontend/src/mobile/BottomTabBar.jsx`:

```jsx
const TABS = [
  { id: 'apps',      icon: '🗂',  label: 'Apps'      },
  { id: 'bookmarks', icon: '🔖',  label: 'Bookmarks' },
  { id: 'news',      icon: '📰',  label: 'News'      },
  { id: 'notes',     icon: '📝',  label: 'Notes'     },
  { id: 'settings',  icon: '⚙️', label: 'Settings'  },
]

export default function BottomTabBar({ activeTab, onChange }) {
  return (
    <nav className="m-tabbar">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`m-tab-item${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="m-tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
          {activeTab === tab.id && <span className="m-tab-dot" />}
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/mobile/BottomTabBar.jsx
git commit -m "feat(mobile): add BottomTabBar component"
```

---

## Task 5: MobileAppsTab

**Files:**
- Create: `frontend/src/mobile/MobileAppsTab.jsx`

- [ ] **Step 1: Create MobileAppsTab.jsx**

Create `frontend/src/mobile/MobileAppsTab.jsx`:

```jsx
import { useState, useRef } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function getIconOverrides() {
  try { return JSON.parse(localStorage.getItem('hub_icon_overrides') || '{}') } catch { return {} }
}

function AppIcon({ app }) {
  const overrides = getIconOverrides()
  const override = overrides[app.id]
  const iconSrc = !override ? app.customIcon : null

  if (!override && iconSrc) {
    return (
      <img
        src={iconSrc}
        alt={app.name}
        className="m-app-icon"
        onError={e => { e.target.outerHTML = '<span class="m-app-icon-emoji">🌐</span>' }}
      />
    )
  }
  const emojiValue = override || app.emoji
  if (emojiValue) {
    if (emojiValue.startsWith('http') || emojiValue.startsWith('data:')) {
      return (
        <img
          src={emojiValue}
          alt={app.name}
          className="m-app-icon"
          onError={e => { e.target.outerHTML = '<span class="m-app-icon-emoji">🌐</span>' }}
        />
      )
    }
    return <span className="m-app-icon-emoji">{emojiValue}</span>
  }
  const src = app.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(tryHost(app.url))}`
  return (
    <img
      src={src}
      alt={app.name}
      className="m-app-icon"
      onError={e => { e.target.outerHTML = '<span class="m-app-icon-emoji">🌐</span>' }}
    />
  )
}

function ActionSheet({ app, onEdit, onDelete, onClose }) {
  return (
    <div className="m-sheet-overlay" onClick={onClose}>
      <div className="m-sheet" onClick={e => e.stopPropagation()}>
        <div className="m-sheet-title">{app.name}</div>
        <button className="m-sheet-action" onClick={() => { onEdit(app); onClose() }}>
          ✎&nbsp; Edit App
        </button>
        <button className="m-sheet-action danger" onClick={() => { onDelete(app.id); onClose() }}>
          🗑&nbsp; Delete App
        </button>
        <button className="m-sheet-action cancel" onClick={onClose}>
          ✕&nbsp; Cancel
        </button>
      </div>
    </div>
  )
}

function AppCell({ app, onLongPress }) {
  const timerRef = useRef(null)

  function handleTouchStart() {
    timerRef.current = setTimeout(() => onLongPress(app), 500)
  }
  function handleTouchEnd() {
    clearTimeout(timerRef.current)
  }
  function handleClick() {
    clearTimeout(timerRef.current)
    window.open(app.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="m-app-cell"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <AppIcon app={app} />
      <div className="m-app-name">{app.name}</div>
    </div>
  )
}

export default function MobileAppsTab({ groups, apps, onAddApp, onEditApp, onDeleteApp }) {
  const [sheet, setSheet] = useState(null)   // app object or null

  function appsInGroup(gid) {
    return apps.filter(a => a.groupId === gid)
  }
  const ungrouped = apps.filter(a => !a.groupId || !groups.find(g => g.id === a.groupId))

  return (
    <div>
      {groups.map(group => {
        const groupApps = appsInGroup(group.id)
        return (
          <div key={group.id}>
            <div className="m-group-header">
              <div className="m-group-dot" style={{ background: group.color }} />
              {group.name}
            </div>
            <div className="m-app-grid">
              {groupApps.map(app => (
                <AppCell
                  key={app.id}
                  app={app}
                  onLongPress={setSheet}
                />
              ))}
            </div>
            <div className="m-add-app-row" onClick={() => onAddApp(group.id)}>
              <span>＋</span> Add App
            </div>
          </div>
        )
      })}

      {ungrouped.length > 0 && (
        <div>
          <div className="m-group-header">
            <div className="m-group-dot" style={{ background: 'var(--text3)' }} />
            Other
          </div>
          <div className="m-app-grid">
            {ungrouped.map(app => (
              <AppCell key={app.id} app={app} onLongPress={setSheet} />
            ))}
          </div>
        </div>
      )}

      {sheet && (
        <ActionSheet
          app={sheet}
          onEdit={onEditApp}
          onDelete={onDeleteApp}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/mobile/MobileAppsTab.jsx
git commit -m "feat(mobile): add MobileAppsTab with icon grid and long-press action sheet"
```

---

## Task 6: MobileBookmarksTab

**Files:**
- Create: `frontend/src/mobile/MobileBookmarksTab.jsx`

- [ ] **Step 1: Create MobileBookmarksTab.jsx**

Create `frontend/src/mobile/MobileBookmarksTab.jsx`:

```jsx
import { useState, useRef } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function iconSrc(item) {
  if (item.customIcon) return item.customIcon
  try {
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(item.url).hostname)}`
  } catch { return '' }
}

function SwipeRow({ item, onEdit, onDelete }) {
  const startXRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const REVEAL = 144   // px — total width of Edit + Delete buttons

  function onTouchStart(e) {
    startXRef.current = e.touches[0].clientX
  }
  function onTouchMove(e) {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    if (dx < 0) setOffset(Math.max(dx, -REVEAL))
  }
  function onTouchEnd() {
    startXRef.current = null
    // Snap open if past half, else snap closed
    setOffset(prev => prev < -(REVEAL / 2) ? -REVEAL : 0)
  }

  return (
    <div className="m-bm-row-wrap">
      {/* Action buttons revealed behind the row */}
      <div className="m-bm-actions-bg">
        <button className="m-bm-action-btn edit" onClick={() => { setOffset(0); onEdit(item) }}>
          ✎<br /><span style={{ fontSize: 10 }}>Edit</span>
        </button>
        <button className="m-bm-action-btn delete" onClick={() => { setOffset(0); onDelete(item.id) }}>
          🗑<br /><span style={{ fontSize: 10 }}>Delete</span>
        </button>
      </div>

      {/* The row itself — slides left to reveal buttons */}
      <div
        className="m-bm-row"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (offset !== 0) { setOffset(0); return }
          window.open(item.url, '_blank', 'noopener,noreferrer')
        }}
      >
        <img
          src={iconSrc(item)}
          alt=""
          className="m-bm-favicon"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="m-bm-info">
          <div className="m-bm-name">{item.name}</div>
          <div className="m-bm-domain">{tryHost(item.url)}</div>
        </div>
      </div>
    </div>
  )
}

export default function MobileBookmarksTab({ onAddBookmark, onEditBookmark, onDeleteBookmark }) {
  // Read bookmarks from localStorage (same key BookmarksTab uses)
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wsh_bookmarks') || '[]') } catch { return [] }
  })

  // Keep in sync if the user edits via desktop in another tab (rare but possible)
  function refresh() {
    try { setItems(JSON.parse(localStorage.getItem('wsh_bookmarks') || '[]')) } catch { setItems([]) }
  }

  // Group by folder
  const folders = {}
  items.forEach(item => {
    const key = item.group || '—'
    if (!folders[key]) folders[key] = []
    folders[key].push(item)
  })

  return (
    <div>
      <button className="m-bm-add-btn" onClick={() => { onAddBookmark(); refresh() }}>
        ＋ Add Bookmark
      </button>

      {Object.entries(folders).map(([folder, folderItems]) => (
        <div key={folder}>
          <div className="m-group-header">
            <div className="m-group-dot" style={{ background: 'var(--accent2)' }} />
            {folder}
          </div>
          <div className="m-bm-list">
            {folderItems.map(item => (
              <SwipeRow
                key={item.id}
                item={item}
                onEdit={(bm) => { onEditBookmark(bm); refresh() }}
                onDelete={(id) => {
                  onDeleteBookmark(id)
                  setItems(prev => prev.filter(x => x.id !== id))
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', paddingTop: 40, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
          No bookmarks yet.<br />Tap "Add Bookmark" to get started.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/mobile/MobileBookmarksTab.jsx
git commit -m "feat(mobile): add MobileBookmarksTab with swipe-to-reveal edit/delete"
```

---

## Task 7: MobileSettingsTab

**Files:**
- Create: `frontend/src/mobile/MobileSettingsTab.jsx`

- [ ] **Step 1: Create MobileSettingsTab.jsx**

Create `frontend/src/mobile/MobileSettingsTab.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MobileSettingsTab({ user, onLogout }) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(
    () => localStorage.getItem('wsh_theme') || 'dark'
  )

  function toggleTheme(t) {
    setTheme(t)
    localStorage.setItem('wsh_theme', t)
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  return (
    <div>
      {/* Account */}
      <div className="m-settings-section">
        <div className="m-settings-row">
          <span className="m-settings-label">Account</span>
          <span className="m-settings-value">{user?.email}</span>
        </div>
        <div className="m-settings-row">
          <span className="m-settings-label">Role</span>
          <span className="m-settings-badge">{user?.role || 'free'}</span>
        </div>
      </div>

      {/* Theme */}
      <div className="m-settings-section">
        <div className="m-settings-row">
          <span className="m-settings-label">Theme</span>
          <div className="m-theme-toggle">
            <button
              className={`m-theme-btn${theme === 'dark' ? ' active' : ''}`}
              onClick={() => toggleTheme('dark')}
            >
              🌙 Dark
            </button>
            <button
              className={`m-theme-btn${theme === 'light' ? ' active' : ''}`}
              onClick={() => toggleTheme('light')}
            >
              ☀️ Light
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <button className="m-logout-full-btn" onClick={onLogout}>
        Log out
      </button>

      <button className="m-desktop-link" onClick={() => navigate('/dashboard')}>
        Switch to Desktop version →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/mobile/MobileSettingsTab.jsx
git commit -m "feat(mobile): add MobileSettingsTab with theme toggle and desktop link"
```

---

## Task 8: MobileDashboard — top-level page

**Files:**
- Create: `frontend/src/mobile/MobileDashboard.jsx`

This is the main page. It wires TopBar, BottomTabBar, and all tab panels together. It also handles cloud sync (same pattern as DashboardPage), app modal, and bookmark operations.

- [ ] **Step 1: Create MobileDashboard.jsx**

Create `frontend/src/mobile/MobileDashboard.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useHubState } from '../dashboard/hooks/useHubState'
import TopBar from './TopBar'
import BottomTabBar from './BottomTabBar'
import MobileAppsTab from './MobileAppsTab'
import MobileBookmarksTab from './MobileBookmarksTab'
import MobileSettingsTab from './MobileSettingsTab'
import AppModal from '../dashboard/AppModal'
import ConfirmModal from '../components/ConfirmModal'
import NewsTab from '../dashboard/NewsTab'
import NotesTab from '../dashboard/tabs/NotesTab'
import { DEFAULT_NEWS_SOURCES } from '../dashboard/constants'
import './mobile.css'

export default function MobileDashboard() {
  const { accessToken, user, logout, sync, initSync } = useAuth()
  const hub = useHubState()

  const [activeTab,   setActiveTab]   = useState('apps')
  const [appModal,    setAppModal]    = useState(null)   // { app } or null
  const [deleteAppId, setDeleteAppId] = useState(null)   // id to confirm-delete
  const [syncEnabled, setSyncEnabled] = useState(false)

  // ── Cloud sync init (same pattern as DashboardPage) ───────────────────────
  useEffect(() => {
    if (!accessToken) return
    const SYNC_DONE = 'cw_synced'
    if (sessionStorage.getItem(SYNC_DONE)) { setSyncEnabled(true); return }
    if (user?.id) localStorage.setItem('wsh_last_user_id', user.id)
    initSync(accessToken).then(cloudSettings => {
      sessionStorage.setItem(SYNC_DONE, '1')
      if (cloudSettings) window.location.reload()
      else setSyncEnabled(true)
    }).catch(() => { sessionStorage.setItem(SYNC_DONE, '1'); setSyncEnabled(true) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-sync on hub changes ───────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !syncEnabled) return
    const timer = setTimeout(() => sync(accessToken), 2000)
    return () => clearTimeout(timer)
  }, [hub.groups, hub.apps, syncEnabled, accessToken, sync])

  // ── News sources (read from localStorage, same key as desktop) ────────────
  const [sources, setSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wsh_news_sources')) || DEFAULT_NEWS_SOURCES }
    catch { return DEFAULT_NEWS_SOURCES }
  })

  function handleLogout() {
    logout()
  }

  // ── App modal helpers ──────────────────────────────────────────────────────
  function openAddApp(groupId) {
    setAppModal({
      app: { id: null, name: '', url: '', groupId: groupId || hub.groups[0]?.id || '', emoji: null, favicon: '', shortcut: '' }
    })
  }
  function openEditApp(app) {
    setAppModal({ app: { ...app } })
  }
  function handleSaveApp(data) {
    hub.saveApp(data)
    setAppModal(null)
    if (accessToken) sync(accessToken).catch(() => {})
  }
  function handleDeleteApp(id) {
    hub.deleteApp(id)
    setDeleteAppId(null)
    if (accessToken) sync(accessToken).catch(() => {})
  }

  // ── Bookmarks helpers (MobileBookmarksTab manages its own localStorage reads)
  function handleAddBookmark() {
    // Open desktop BookmarksTab modal is complex — for mobile we do a simple prompt
    const url = window.prompt('Bookmark URL:')
    if (!url) return
    const name = window.prompt('Name:', (() => { try { return new URL(url).hostname.replace('www.','') } catch { return url } })())
    if (!name) return
    const bookmarks = JSON.parse(localStorage.getItem('wsh_bookmarks') || '[]')
    bookmarks.push({ id: 'bm_' + Date.now(), url, name, group: '' })
    localStorage.setItem('wsh_bookmarks', JSON.stringify(bookmarks))
    if (accessToken) sync(accessToken).catch(() => {})
  }
  function handleEditBookmark(item) {
    const name = window.prompt('Name:', item.name)
    if (name === null) return
    const url = window.prompt('URL:', item.url)
    if (url === null) return
    const bookmarks = JSON.parse(localStorage.getItem('wsh_bookmarks') || '[]')
    const updated = bookmarks.map(b => b.id === item.id ? { ...b, name, url } : b)
    localStorage.setItem('wsh_bookmarks', JSON.stringify(updated))
    if (accessToken) sync(accessToken).catch(() => {})
  }
  function handleDeleteBookmark(id) {
    const bookmarks = JSON.parse(localStorage.getItem('wsh_bookmarks') || '[]')
    localStorage.setItem('wsh_bookmarks', JSON.stringify(bookmarks.filter(b => b.id !== id)))
    if (accessToken) sync(accessToken).catch(() => {})
  }

  // ── Notes stub tab (reuse NotesTab with a dummy tab object) ───────────────
  const mobileNotesTab = { id: 'mobile_notes', name: 'Notes', icon: '📝', type: 'notes' }

  return (
    <div className="mobile-shell">
      <TopBar user={user} onLogout={handleLogout} />

      <div className="m-content">
        {activeTab === 'apps' && (
          <MobileAppsTab
            groups={hub.groups}
            apps={hub.apps}
            onAddApp={openAddApp}
            onEditApp={openEditApp}
            onDeleteApp={(id) => setDeleteAppId(id)}
          />
        )}
        {activeTab === 'bookmarks' && (
          <MobileBookmarksTab
            onAddBookmark={handleAddBookmark}
            onEditBookmark={handleEditBookmark}
            onDeleteBookmark={handleDeleteBookmark}
          />
        )}
        {activeTab === 'news' && (
          <div className="m-tab-passthrough">
            <NewsTab
              sources={sources}
              onSourcesChange={setSources}
              newsGroups={[]}
              onNewsGroupsChange={() => {}}
              onAddSource={() => {}}
            />
          </div>
        )}
        {activeTab === 'notes' && (
          <div className="m-tab-passthrough">
            <NotesTab tab={mobileNotesTab} />
          </div>
        )}
        {activeTab === 'settings' && (
          <MobileSettingsTab user={user} onLogout={handleLogout} />
        )}
      </div>

      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />

      {appModal && (
        <AppModal
          app={appModal.app}
          groups={hub.groups}
          onSave={handleSaveApp}
          onDelete={handleDeleteApp}
          onClose={() => setAppModal(null)}
        />
      )}

      {deleteAppId && (
        <ConfirmModal
          title="Delete App"
          message={`Delete "${hub.apps.find(a => a.id === deleteAppId)?.name || 'this app'}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmStyle="danger"
          onConfirm={() => handleDeleteApp(deleteAppId)}
          onCancel={() => setDeleteAppId(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/mobile/MobileDashboard.jsx
git commit -m "feat(mobile): add MobileDashboard top-level page with cloud sync and tab routing"
```

---

## Task 9: Wire up route and login redirect

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/LoginPage.jsx`

- [ ] **Step 1: Add /mobile route to App.jsx**

Replace the entire content of `frontend/src/App.jsx` with:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import MobileDashboard from './mobile/MobileDashboard'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import UsersPage from './pages/admin/UsersPage'
import StatsPage from './pages/admin/StatsPage'
import BroadcastPage from './pages/admin/BroadcastPage'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/mobile" element={
            <ProtectedRoute><MobileDashboard /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><SettingsPage /></ProtectedRoute>
          } />
          <Route path="/admin" element={<AdminRoute><AdminLayout><StatsPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/stats" element={<AdminRoute><AdminLayout><StatsPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminLayout><UsersPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/broadcast" element={<AdminRoute><AdminLayout><BroadcastPage /></AdminLayout></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Add mobile redirect to LoginPage.jsx**

In `frontend/src/pages/LoginPage.jsx`, replace line 30:

```js
navigate('/dashboard')
```

with:

```js
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
navigate(isMobile ? '/mobile' : '/dashboard')
```

The full `handleSubmit` after the change should look like:

```js
async function handleSubmit(e) {
  e.preventDefault()
  setError('')
  setLoading(true)
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Login failed')
      return
    }
    login(data.accessToken, data.user, password)
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    navigate(isMobile ? '/mobile' : '/dashboard')
  } catch {
    setError('Network error. Please try again.')
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 3: Verify app compiles**

Run `npm run dev` in `frontend/`. Open `http://localhost:5173/mobile` in the browser. You should see the mobile dashboard render (TopBar + BottomTabBar visible, Apps tab active).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/pages/LoginPage.jsx
git commit -m "feat(mobile): add /mobile route and auto-redirect mobile browsers after login"
```

---

## Task 10: Manual QA + deploy

- [ ] **Step 1: Test on desktop browser — confirm no regressions**

Open `http://localhost:5173/dashboard`. Verify:
- Desktop dashboard loads normally
- All tabs work (News, Bookmarks, Notes, Widgets, custom tabs)
- Drag-and-drop on Apps tab still works
- Login redirects to `/dashboard` on a desktop browser

- [ ] **Step 2: Test mobile view in Chrome DevTools**

Open Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M). Set device to "iPhone 12 Pro" (390×844). Open `http://localhost:5173/mobile`. Verify:
- TopBar shows "☁ CloudDesktop" + avatar + logout
- BottomTabBar shows 5 tabs, Apps is active
- App groups render with colored headers
- App icons show correct favicons
- Tapping an app opens it in a new tab
- Long-pressing an app shows the action sheet with Edit/Delete/Cancel
- Switching tabs works (Bookmarks, News, Notes, Settings)
- MobileSettingsTab shows email, role badge, theme toggle, logout, "Desktop version" link
- Theme toggle switches dark/light
- "Switch to Desktop version →" navigates to `/dashboard`

- [ ] **Step 3: Test PWA install on mobile (optional)**

On an Android phone, open `https://clouddesktop.infoplay.com/mobile` in Chrome. Tap the install banner or use ⋮ → "Add to Home screen". Confirm the app icon appears and opens full-screen.

- [ ] **Step 4: Push and deploy**

```bash
git push
```

CI/CD will build and deploy automatically. Verify live at `https://clouddesktop.infoplay.com/mobile`.

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered by |
|---|---|
| `/mobile` route + ProtectedRoute | Task 9 |
| Auto-redirect mobile after login | Task 9 |
| TopBar: logo + avatar + logout | Task 3 |
| BottomTabBar: 5 tabs, active state | Task 4 |
| Apps tab: 4-col icon grid per group | Task 5 |
| Tap app → new tab | Task 5 (AppCell onClick) |
| Long-press → action sheet (Edit/Delete/Cancel) | Task 5 (ActionSheet + timerRef) |
| Ungrouped apps under "Other" | Task 5 |
| Add App row per group | Task 5 |
| Bookmarks list grouped by folder | Task 6 |
| Swipe-right → Edit/Delete | Task 6 (SwipeRow) |
| Tap bookmark → new tab | Task 6 |
| News tab: reuse NewsTab | Task 8 |
| Notes tab: reuse NotesTab | Task 8 |
| Settings: email, role, theme toggle, logout, desktop link | Task 7 |
| PWA manifest.json | Task 1 |
| PWA meta tags in index.html | Task 1 |
| mobile.css with all component styles | Task 2 |
| Cloud sync (initSync + auto-sync) | Task 8 |
| Desktop untouched | All tasks (only App.jsx + LoginPage.jsx modified minimally) |

All spec requirements are covered. ✅

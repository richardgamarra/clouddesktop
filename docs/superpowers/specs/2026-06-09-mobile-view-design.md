# Mobile View — Design Spec
**Date:** 2026-06-09
**Project:** CloudDesktop Workspace

---

## Overview

A dedicated mobile experience for CloudDesktop served at `/mobile`. Touch-friendly, fast, and visually consistent with the desktop theme. Desktop route (`/dashboard`) and all existing components are completely untouched. Mobile users are auto-redirected after login.

---

## Goals

- Give mobile users a first-class launcher experience
- Reuse all existing auth, data, and API hooks — no new backend work
- Installable as a PWA (home screen icon, full-screen standalone mode)
- Zero risk to the existing desktop UI

---

## Routes

| Route | Component | Guard |
|---|---|---|
| `/mobile` | `MobileDashboard` | `ProtectedRoute` |
| `/dashboard` | `DashboardPage` (unchanged) | `ProtectedRoute` |

Add `/mobile` to `App.jsx` router. All other routes unchanged.

---

## Mobile Redirect

In `LoginPage.jsx`, after a successful login response, detect the device before calling `navigate()`:

```js
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
navigate(isMobile ? '/mobile' : '/dashboard')
```

`ProtectedRoute` redirects unauthenticated users to `/login` — no change needed there.

A "Desktop version →" link at the bottom of the mobile Settings tab lets users manually switch to `/dashboard`.

---

## Screen Layout

```
┌─────────────────────────┐
│  ☁ CloudDesktop    👤   │  ← TopBar (fixed, 52px)
├─────────────────────────┤
│                         │
│   [scrollable content]  │  ← content area, fills remaining height
│                         │
├─────────────────────────┤
│  Apps  Bookmarks  News  │  ← BottomTabBar (fixed, 60px)
│  Notes    Settings      │
└─────────────────────────┘
```

- TopBar: logo left, avatar/logout button right. Height 52px. Background `var(--surface)`, border-bottom `var(--border)`.
- BottomTabBar: 5 tabs — Apps, Bookmarks, News, Notes, Settings. Height 60px + safe-area-inset-bottom (for iPhone notch). Active tab highlighted with `var(--accent)`. Background `var(--surface)`, border-top `var(--border)`.
- Content area: `overflow-y: auto`, `-webkit-overflow-scrolling: touch`, padding `0 0 env(safe-area-inset-bottom)`.

---

## Components

### `MobileDashboard.jsx`
- Top-level page component at `/mobile`
- Reads auth from `useAuth()`
- Loads hub state via `useHubState()` (same hook desktop uses)
- Manages `activeTab` state (default: `'apps'`)
- Renders `<TopBar>`, `<BottomTabBar>`, and the active tab panel

### `TopBar.jsx`
- Displays "☁ CloudDesktop" wordmark left
- Right side: user avatar initial in a circle + logout button (icon only on small screens)
- Fixed position, `z-index: 100`

### `BottomTabBar.jsx`
- Props: `activeTab`, `onChange`
- 5 items: Apps (🗂), Bookmarks (🔖), News (📰), Notes (📝), Settings (⚙️)
- Each item: icon above label, 11px font, active = `var(--accent)` color + underline dot
- `position: fixed; bottom: 0`; uses `padding-bottom: env(safe-area-inset-bottom)`

### `MobileAppsTab.jsx`
- Groups from `hub.groups` stacked vertically
- Each group: colored dot + group name header (13px, `var(--text2)`)
- Apps inside: 4-column icon grid
  - Cell: 64px icon (`AppIcon` reused from desktop), name below (10px, 2-line clamp)
  - Tap → `window.open(app.url, '_blank')`
  - Long-press (500ms `touchstart` timer) → opens a small bottom-sheet action menu: Edit, Delete, Cancel
- Ungrouped apps shown last under "Other" header
- "Add App" row at the bottom of each group (tapping opens `AppModal`, same as desktop)

### `MobileBookmarksTab.jsx`
- Flat list grouped by folder name
- Each row: 32px favicon + name (13px bold) + domain (11px `var(--text3)`)
- Tap row → `window.open(url, '_blank')`
- Swipe-right on a row → reveals Edit / Delete actions (using `touchstart`/`touchend` delta)
- "Add Bookmark" button at top

### `MobileNewsTab.jsx`
- Reuse `NewsTab.jsx` directly — it already works on narrow screens
- Wrap in a div with appropriate padding if needed

### `MobileNotesTab.jsx`
- Reuse `NotesTab.jsx` directly — it is text-based and already responsive

### `MobileSettingsTab.jsx`
- Account info: email, role badge
- Theme toggle: Dark / Light (same `wsh_theme` localStorage key)
- Logout button
- "Switch to Desktop version →" link → `navigate('/dashboard')`

---

## App Icon Grid — Detail

```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ icon │ │ icon │ │ icon │ │ icon │
│ Name │ │ Name │ │ Name │ │ Name │
└──────┘ └──────┘ └──────┘ └──────┘
```

- Grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px`
- Cell width: ~72px on a 320px screen
- Icon: 48px × 48px, `border-radius: 12px`, auto-fetched favicon (same `AppIcon` component)
- Label: `font-size: 10px; font-weight: 600; text-align: center; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; overflow: hidden`
- Active/open apps: subtle `var(--accent)` border on icon (1px)

---

## Long-Press Action Sheet

Triggered after 500ms hold on an app icon. A bottom sheet slides up:

```
┌─────────────────────────┐
│  ✎ Edit App             │
│  🗑 Delete App          │
│  ✕ Cancel               │
└─────────────────────────┘
```

- Semi-transparent dark overlay behind sheet
- Sheet: `border-radius: 16px 16px 0 0`, `background: var(--s2)`
- Each action: 48px tall row, `font-size: 15px`
- Cancel row: `color: var(--text3)`
- Edit → opens `AppModal` (same as desktop)
- Delete → opens `ConfirmModal` (same as desktop)

---

## PWA Manifest

**File:** `frontend/public/manifest.json`

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

**Reference in `index.html`:**
```html
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="CloudDesktop" />
<meta name="theme-color" content="#0b0d12" />
```

No service worker in this phase — offline mode is future scope.

---

## Styling

- All CSS variables reused directly (`var(--bg)`, `var(--accent)`, `var(--text)`, etc.)
- Fonts: Plus Jakarta Sans + DM Mono already loaded globally
- New file: `frontend/src/mobile/mobile.css` for mobile-specific layout rules
- Touch targets minimum 44px × 44px throughout
- `font-size` minimum 11px (no text smaller than this)
- No horizontal scrolling on any screen (all content fits within viewport width)

---

## File Structure

```
frontend/src/
  mobile/
    MobileDashboard.jsx       ← top-level page
    TopBar.jsx
    BottomTabBar.jsx
    MobileAppsTab.jsx
    MobileBookmarksTab.jsx
    MobileSettingsTab.jsx
    mobile.css
frontend/public/
  manifest.json               ← new
frontend/src/
  index.html                  ← add manifest link tags
  App.jsx                     ← add /mobile route
  pages/
    LoginPage.jsx              ← add mobile redirect after login
```

`MobileNewsTab` and `MobileNotesTab` are thin wrappers that reuse existing tab components directly — no separate files needed.

---

## What Does NOT Change

- `DashboardPage.jsx` — zero edits
- `DesktopView.jsx` — zero edits
- All desktop components — zero edits
- All existing routes — unchanged
- Backend — zero edits
- Database — zero edits

---

## Out of Scope (future)

- Service worker / offline mode
- Push notifications
- Drag-to-reorder on mobile
- Mobile-specific widgets
- Swipe gestures between tabs

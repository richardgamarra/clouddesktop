# Codex Handoff Notes

Last updated: 2026-06-03

## Current Context

CloudDesktop Workspace is a React/Vite frontend with an Express/PostgreSQL backend. The live OVH deployment is reachable over SSH as root on `clouddesktop.infoplay.com` port `2222`.

Do not paste or repeat credentials from chat logs. Sensitive credentials were present in prior pasted dialog and should be treated as secrets.

## Changes Made In This Session

### Bookmarks Drag And Drop

File: `frontend/src/dashboard/tabs/BookmarksTab.jsx`

Implemented drag-and-drop bookmark creation for custom Bookmarks tabs.

Supported drop targets:

- Grid view named bookmark groups
- Grid view ungrouped/empty bookmark area
- Folder view panels

Supported browser drag payloads:

- `text/uri-list`
- `text/plain`
- `text/html`
- Firefox-style `text/x-moz-url`
- `www.example.com` URLs normalized to `https://www.example.com`

Behavior:

- Drag a browser address-bar URL, webpage link, or browser bookmark into a bookmark group.
- The app creates a bookmark using the dropped URL and a best-effort display name from HTML title/text, Firefox title, or hostname.
- Duplicate URLs are ignored within the same bookmark group.
- Drop targets show a "Drop to add bookmark" visual highlight.

### Dashboard JSX Warning

File: `frontend/src/pages/DashboardPage.jsx`

Removed a duplicate `onReorder={hub.reorderApps}` prop on the `AppsTab` JSX element.

The warning meant the same prop was passed twice, with the second value silently overriding the first. In this case both values were identical, so behavior was unchanged.

## Verification

Command run from `frontend/`:

```bash
npm run build
```

Result: build succeeds.

Remaining build note:

- Vite warns that `frontend/src/lib/crypto.js` is both statically and dynamically imported. This is a chunking optimization warning, not a runtime bug. It does not need to be fixed unless clean build output or bundle splitting is desired.

## Deployment

The updated production frontend bundle was copied to OVH:

- Local build output: `backend/public/`
- Remote served path: `/var/www/clouddesktop/backend/public/`

The updated source files were also copied to OVH:

- `/var/www/clouddesktop/frontend/src/dashboard/tabs/BookmarksTab.jsx`
- `/var/www/clouddesktop/frontend/src/pages/DashboardPage.jsx`

Confirmed remote `index.html` loads:

```text
/assets/index-BuFmDmOM.js
```

Confirmed PM2 app status:

- `clouddesktop-api` online

User tested live site and confirmed drag-and-drop worked after deployment.

## Repo State Notes

Known local working tree items after this work:

- Modified: `frontend/src/dashboard/tabs/BookmarksTab.jsx`
- Modified: `frontend/src/pages/DashboardPage.jsx`
- Added: `docs/codex-handoff.md`
- Untracked from before this work: `.claude/settings.local.json`

Vite build output updates files under `backend/public/`.

## Useful Server Context From Prior Dialog

Public CloudDesktop app:

- `https://clouddesktop.infoplay.com`

Server/service context observed in pasted dialog:

- CloudDesktop Workspace app port was reported as `4010`
- Nginx serves frontend static files and proxies API traffic
- Management tools include Webmin, Plesk, web terminal, and Guacamole

Potential config issue discovered earlier:

- `nginx/clouddesktop.conf` says `/api/*` proxies to port `3001`
- `backend/ecosystem.config.cjs` sets `PORT: 4010`
- `backend/server.js` defaults to `4010`

This mismatch is worth checking before future deployment/config work.

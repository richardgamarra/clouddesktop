# Stage 4: Dashboard — React Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the existing index.html WorkSpace Hub into a fully functional React dashboard that replaces DashboardPage.jsx, preserving all localStorage data and all features.

**Architecture:** State is managed with React hooks — `useHubState` for apps/groups, `useOpenWindows` for window-tracking refs. All CSS is extracted from index.html into `dashboard.css`. Components are split by responsibility: Sidebar, TabBar, AppsTab, NewsTab, ContextMenu, and modal components. The localStorage keys (wsh_groups, wsh_apps, wsh_news_sources) are preserved so existing user data survives the migration.

**Tech Stack:** React 18 hooks (useState, useEffect, useRef, useCallback), pure CSS, HTML5 Drag API, fetch API for RSS

---

## File Map

```
frontend/src/
├── pages/
│   └── DashboardPage.jsx          ← REPLACE: full dashboard orchestrator
├── dashboard/
│   ├── dashboard.css              ← NEW: all CSS from index.html <style> block
│   ├── constants.js               ← NEW: DEFAULT_GROUPS, DEFAULT_APPS, EMOJI_LIST, GROUP_COLORS, RSS presets
│   ├── hooks/
│   │   ├── useHubState.js         ← NEW: groups/apps state + localStorage
│   │   └── useOpenWindows.js      ← NEW: winRefs tracking + window.open helper
│   ├── Sidebar.jsx                ← NEW: 72px left sidebar with icon buttons
│   ├── TabBar.jsx                 ← NEW: tab switcher + action buttons per tab
│   ├── AppsTab.jsx                ← NEW: dashboard grid with groups and cards
│   ├── NewsTab.jsx                ← NEW: RSS news cards with source pills
│   ├── ContextMenu.jsx            ← NEW: right-click popup
│   ├── AppModal.jsx               ← NEW: add/edit app modal
│   ├── GroupModal.jsx             ← NEW: add/edit group modal
│   ├── ManageGroupsModal.jsx      ← NEW: manage groups list
│   └── SourceModal.jsx            ← NEW: add news source modal
```

---

## Task 1: CSS + constants extraction

**Files:**
- Create: `frontend/src/dashboard/dashboard.css`
- Create: `frontend/src/dashboard/constants.js`

- [ ] **Step 1.1: Create `frontend/src/dashboard/dashboard.css`**

Extract all styles from the `<style>` block in index.html (lines 7–391). The CSS defines sidebar, tab bar, news cards, app cards, modals, context menu, and animations. Paste it verbatim — do not modify selectors.

```css
/* ═══ SIDEBAR ═══ */
#dashboard-root { display: flex; height: 100vh; overflow: hidden; }
#sb-sidebar {
  width: 72px; background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 2px;
  flex-shrink: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; z-index: 200;
}
#sb-sidebar::-webkit-scrollbar { display: none; }
.sb-logo {
  width: 38px; height: 38px; background: linear-gradient(135deg, var(--accent), var(--purple));
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 8px; flex-shrink: 0;
  box-shadow: 0 4px 18px var(--aglow); letter-spacing: -1px; user-select: none; cursor: pointer;
}
.sb-sep { width: 28px; height: 1px; background: var(--border); margin: 4px 0; flex-shrink: 0; }
.sb-spacer { flex: 1; min-height: 6px; }
.sb-group-label {
  font-size: 8px; font-family: 'DM Mono', monospace; color: var(--text3);
  text-transform: uppercase; letter-spacing: .1em; width: 100%; text-align: center;
  padding: 6px 0 2px; flex-shrink: 0; cursor: default;
}
.app-btn {
  width: 46px; height: 46px; border-radius: 10px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  position: relative; transition: background var(--t), transform var(--t);
  flex-shrink: 0; outline: none; padding: 0;
}
.app-btn:hover { background: var(--s3); transform: scale(1.06); }
.app-btn.is-open { background: rgba(91,127,255,.13); box-shadow: 0 0 0 1.5px var(--accent); }
.app-btn.is-open::before {
  content: ''; position: absolute; left: -9px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 18px; background: var(--accent); border-radius: 2px;
}
.app-btn .odot {
  position: absolute; bottom: 3px; right: 3px; width: 7px; height: 7px; border-radius: 50%;
  background: var(--green); border: 1.5px solid var(--surface); display: none;
}
.app-btn.is-open .odot { display: block; }
.app-btn::after {
  content: attr(data-tip); position: absolute; left: calc(100% + 12px); top: 50%;
  transform: translateY(-50%); background: var(--s3); border: 1px solid var(--border2);
  color: var(--text); font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
  white-space: nowrap; padding: 5px 10px; border-radius: 6px; pointer-events: none;
  opacity: 0; transition: opacity .12s, left .12s; z-index: 9999; box-shadow: 0 4px 14px rgba(0,0,0,.55);
}
.app-btn:hover::after { opacity: 1; left: calc(100% + 8px); }
.sb-add-btn {
  width: 38px; height: 38px; border-radius: 10px; border: 1.5px dashed var(--border2);
  background: transparent; color: var(--text3); font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--t); flex-shrink: 0; margin-top: 4px;
}
.sb-add-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(91,127,255,.13); }

/* ═══ MAIN ═══ */
#db-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

/* ═══ TABS BAR ═══ */
#tabs-bar {
  height: 52px; background: var(--surface); border-bottom: 1px solid var(--border);
  display: flex; align-items: stretch; padding: 0; flex-shrink: 0; gap: 0;
}
.tab-btn {
  display: flex; align-items: center; gap: 7px; padding: 0 20px;
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--text3); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: color var(--t), border-color var(--t), background var(--t);
  white-space: nowrap; flex-shrink: 0;
}
.tab-btn:hover { color: var(--text2); background: var(--s2); }
.tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }
.tab-divider { width: 1px; background: var(--border); margin: 10px 0; flex-shrink: 0; }
.tab-spacer { flex: 1; }
.tab-actions { display: flex; align-items: center; gap: 6px; padding: 0 12px; flex-shrink: 0; }
.tb-btn {
  background: var(--s3); border: 1px solid var(--border); border-radius: 6px; color: var(--text2);
  font-size: 11px; font-family: 'DM Mono', monospace; padding: 4px 10px; cursor: pointer;
  transition: all var(--t); white-space: nowrap;
}
.tb-btn:hover { border-color: var(--accent); color: var(--accent); }
.open-all-btn {
  background: var(--accent); border: none; border-radius: 6px; color: #fff;
  font-size: 11px; font-family: 'DM Mono', monospace; font-weight: 600;
  padding: 4px 11px; cursor: pointer; transition: all var(--t); white-space: nowrap;
}
.open-all-btn:hover { background: var(--accent2); box-shadow: 0 0 14px var(--aglow); }

/* ═══ TAB PANELS ═══ */
.tab-panel { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* ═══ NEWS TAB ═══ */
#news-panel { flex: 1; overflow-y: auto; padding: 28px 32px; scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
.news-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.news-header h1 { font-size: 22px; font-weight: 800; letter-spacing: -.5px; }
.news-header p { font-size: 12px; color: var(--text2); font-family: 'DM Mono', monospace; margin-top: 2px; }
.news-header-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.news-refresh-btn {
  background: var(--s3); border: 1px solid var(--border2); border-radius: 8px;
  color: var(--text2); font-family: 'DM Mono', monospace; font-size: 11px;
  padding: 5px 12px; cursor: pointer; transition: all var(--t); display: flex; align-items: center; gap: 5px;
}
.news-refresh-btn:hover { border-color: var(--accent); color: var(--accent); }
.news-refresh-btn.spinning svg { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.news-add-source-btn {
  background: var(--accent); border: none; border-radius: 8px; color: #fff;
  font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 600;
  padding: 5px 12px; cursor: pointer; transition: all var(--t);
}
.news-add-source-btn:hover { background: var(--accent2); }
.source-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 22px; align-items: center; }
.source-pill {
  background: var(--s2); border: 1px solid var(--border); border-radius: 20px;
  padding: 4px 12px; font-size: 11px; font-family: 'DM Mono', monospace; color: var(--text2);
  cursor: pointer; transition: all var(--t); display: flex; align-items: center; gap: 5px;
  white-space: nowrap; user-select: none;
}
.source-pill:hover { border-color: var(--border2); color: var(--text); }
.source-pill.active { background: rgba(91,127,255,.13); border-color: var(--accent); color: var(--accent2); }
.source-pill .pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.source-pill .pill-remove {
  width: 14px; height: 14px; border-radius: 50%; background: rgba(255,91,110,.13); color: var(--red);
  font-size: 9px; display: none; align-items: center; justify-content: center;
  cursor: pointer; border: none; flex-shrink: 0; line-height: 1; font-weight: 700;
}
.source-pill:hover .pill-remove { display: flex; }
.news-source-section { margin-bottom: 32px; }
.news-source-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  padding-bottom: 10px; border-bottom: 1px solid var(--border);
}
.news-source-logo {
  width: 28px; height: 28px; border-radius: 7px; background: var(--s3);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
  overflow: hidden; flex-shrink: 0;
}
.news-source-logo img { width: 22px; height: 22px; border-radius: 4px; }
.news-source-name { font-size: 14px; font-weight: 800; }
.news-source-url { font-size: 10px; color: var(--text3); font-family: 'DM Mono', monospace; margin-top: 1px; }
.news-source-spacer { flex: 1; }
.news-open-source-btn {
  background: transparent; border: 1px solid var(--border); border-radius: 6px;
  color: var(--text3); font-size: 10px; font-family: 'DM Mono', monospace;
  padding: 3px 9px; cursor: pointer; transition: all var(--t);
}
.news-open-source-btn:hover { border-color: var(--border2); color: var(--text2); }
.news-cards-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto auto; gap: 10px;
}
.news-card {
  background: var(--s2); border: 1px solid var(--border); border-radius: var(--r);
  overflow: hidden; cursor: pointer;
  transition: transform var(--t), border-color var(--t), box-shadow var(--t);
  display: flex; flex-direction: column; text-decoration: none;
}
.news-card:hover { transform: translateY(-2px); border-color: var(--border2); box-shadow: 0 8px 28px rgba(0,0,0,.35); }
.news-card.hero { grid-column: span 2; grid-row: span 2; }
.news-card-img {
  width: 100%; aspect-ratio: 16/9; background: var(--s3);
  display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; position: relative;
}
.news-card.hero .news-card-img { aspect-ratio: 16/10; }
.news-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.news-card-img .img-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; color: var(--text3); font-family: 'DM Mono', monospace; font-size: 10px;
  padding: 16px; text-align: center; width: 100%; height: 100%;
}
.news-card-img .img-placeholder svg { opacity: .4; }
.news-card-body { padding: 12px; flex: 1; display: flex; flex-direction: column; gap: 5px; }
.news-card.hero .news-card-body { padding: 16px; }
.news-card-category { font-size: 9px; font-family: 'DM Mono', monospace; color: var(--accent2); text-transform: uppercase; letter-spacing: .1em; }
.news-card-title {
  font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.news-card.hero .news-card-title { font-size: 16px; -webkit-line-clamp: 4; }
.news-card-desc {
  font-size: 11px; color: var(--text2); font-family: 'DM Mono', monospace; line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.news-card-meta { margin-top: auto; padding-top: 6px; font-size: 10px; color: var(--text3); font-family: 'DM Mono', monospace; display: flex; align-items: center; gap: 8px; }
.news-card-source-tag { background: var(--s3); border-radius: 4px; padding: 1px 6px; font-size: 9px; color: var(--text2); font-family: 'DM Mono', monospace; }
.skeleton { background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.news-error {
  background: rgba(255,91,110,.13); border: 1px solid rgba(255,91,110,.25); border-radius: 10px;
  padding: 14px 16px; font-size: 12px; font-family: 'DM Mono', monospace; color: var(--red);
  display: flex; align-items: center; gap: 10px;
}

/* ═══ HUB TAB ═══ */
#hub-panel { flex: 1; overflow-y: auto; padding: 28px 32px; scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
.dash-hero { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.dash-logo {
  width: 50px; height: 50px; background: linear-gradient(135deg, var(--accent), var(--purple));
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 800; color: #fff; flex-shrink: 0;
  box-shadow: 0 6px 24px var(--aglow); letter-spacing: -2px;
}
.dash-hero h1 { font-size: 21px; font-weight: 800; letter-spacing: -.5px; }
.dash-hero p { font-size: 12px; color: var(--text2); font-family: 'DM Mono', monospace; margin-top: 3px; }
.dash-group { margin-bottom: 32px; }
.dash-group-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.dash-group-color { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dash-group-name { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: .01em; }
.dash-group-count { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text3); }
.dash-group-spacer { flex: 1; }
.dash-group-actions { display: flex; gap: 6px; }
.dash-group-btn {
  background: transparent; border: 1px solid var(--border); border-radius: 6px;
  color: var(--text3); font-size: 10px; font-family: 'DM Mono', monospace;
  padding: 3px 8px; cursor: pointer; transition: all var(--t); white-space: nowrap;
}
.dash-group-btn:hover { border-color: var(--border2); color: var(--text2); }
.dash-group-btn.danger:hover { border-color: var(--red); color: var(--red); }
.app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 9px; }
.app-card {
  background: var(--s2); border: 1px solid var(--border); border-radius: var(--r);
  padding: 15px 13px 12px; cursor: pointer;
  transition: background var(--t), border-color var(--t), transform var(--t), box-shadow var(--t);
  position: relative; display: flex; flex-direction: column; gap: 9px; user-select: none;
}
.app-card:hover { background: var(--s3); border-color: var(--border2); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
.app-card.is-open { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 6px 20px var(--aglow); }
.card-icon { width: 38px; height: 38px; border-radius: 9px; background: var(--s3); display: flex; align-items: center; justify-content: center; font-size: 21px; overflow: hidden; flex-shrink: 0; }
.card-icon img { width: 26px; height: 26px; border-radius: 5px; display: block; }
.card-name { font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-url { font-size: 10px; color: var(--text3); font-family: 'DM Mono', monospace; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-shortcut { font-size: 9px; font-family: 'DM Mono', monospace; color: var(--accent2); margin-top: 1px; }
.card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.card-status { font-size: 10px; font-family: 'DM Mono', monospace; display: flex; align-items: center; gap: 4px; color: var(--text3); }
.card-status .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--text3); flex-shrink: 0; }
.card-status.open .dot { background: var(--green); animation: pulse 2.5s infinite; }
.card-status.open { color: var(--green); }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
.card-action-btn {
  background: var(--s4); border: 1px solid var(--border2); border-radius: 5px; color: var(--text2);
  font-size: 10px; font-family: 'DM Mono', monospace; padding: 3px 8px; cursor: pointer;
  transition: all var(--t); white-space: nowrap; flex-shrink: 0;
}
.card-action-btn:hover, .app-card.is-open .card-action-btn { background: var(--accent); border-color: var(--accent); color: #fff; }
.add-card {
  background: transparent; border: 1.5px dashed var(--border2); border-radius: var(--r);
  padding: 15px 13px; cursor: pointer; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px; min-height: 110px;
  transition: all var(--t); color: var(--text3);
}
.add-card:hover { border-color: var(--accent); color: var(--accent); background: rgba(91,127,255,.13); }
.add-card-icon { font-size: 22px; }
.add-card-label { font-size: 11px; font-family: 'DM Mono', monospace; letter-spacing: .04em; }
.app-card.dragging { opacity: .4; transform: scale(.92); }

/* ═══ CONTEXT MENU ═══ */
.ctx-menu {
  position: fixed; z-index: 9100; min-width: 180px;
  background: var(--s2); border: 1px solid var(--border2); border-radius: 9px;
  padding: 5px; box-shadow: 0 16px 48px rgba(0,0,0,.65);
  animation: pop-in .12s cubic-bezier(.34,1.56,.64,1);
}
@keyframes pop-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
.ctx-item { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; color: var(--text2); transition: all var(--t); white-space: nowrap; }
.ctx-item:hover { background: var(--s3); color: var(--text); }
.ctx-item.danger:hover { background: rgba(255,91,110,.13); color: var(--red); }
.ctx-item .ctx-ico { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
.ctx-sep { height: 1px; background: var(--border); margin: 4px 2px; }
.ctx-header { padding: 5px 10px 3px; font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; }

/* ═══ MODALS ═══ */
.modal-overlay { position: fixed; inset: 0; z-index: 9500; background: rgba(0,0,0,.75); backdrop-filter: blur(5px); display: none; align-items: center; justify-content: center; }
.modal-overlay.open { display: flex; }
.modal-box {
  background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r);
  width: 460px; max-width: calc(100vw - 24px); max-height: calc(100vh - 40px); overflow-y: auto;
  padding: 28px; box-shadow: 0 28px 72px rgba(0,0,0,.7);
  animation: modal-in .17s cubic-bezier(.34,1.56,.64,1); scrollbar-width: thin; scrollbar-color: var(--border2) transparent;
}
@keyframes modal-in { from { opacity: 0; transform: scale(.93) translateY(8px); } to { opacity: 1; transform: none; } }
.modal-title { font-size: 17px; font-weight: 800; color: var(--text); margin-bottom: 3px; }
.modal-sub { font-size: 11px; color: var(--text3); font-family: 'DM Mono', monospace; margin-bottom: 20px; }
.modal-preview { display: flex; align-items: center; gap: 12px; background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }
.modal-preview-icon { width: 34px; height: 34px; border-radius: 8px; font-size: 26px; display: flex; align-items: center; justify-content: center; background: var(--s3); flex-shrink: 0; }
.modal-preview-icon img { width: 28px; height: 28px; border-radius: 6px; }
.modal-preview-name { font-size: 13px; font-weight: 700; color: var(--text); }
.modal-preview-url { font-size: 10px; color: var(--text3); font-family: 'DM Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.modal-preview-shortcut { font-size: 10px; color: var(--accent2); font-family: 'DM Mono', monospace; margin-top: 2px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { background: var(--s3); border: 1px solid var(--border2); border-radius: 8px; color: var(--text2); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600; padding: 8px 16px; cursor: pointer; transition: all var(--t); }
.btn-cancel:hover { background: var(--s4); }
.btn-danger { background: transparent; border: 1px solid var(--red); border-radius: 8px; color: var(--red); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; padding: 8px 16px; cursor: pointer; transition: all var(--t); margin-right: auto; }
.btn-danger:hover { background: rgba(255,91,110,.13); }
.shortcut-capture { background: var(--s2); border: 1px solid var(--border2); border-radius: 8px; padding: 9px 12px; font-family: 'DM Mono', monospace; font-size: 13px; color: var(--text); cursor: pointer; user-select: none; transition: border-color var(--t); min-height: 38px; display: flex; align-items: center; justify-content: space-between; }
.shortcut-capture.listening { border-color: var(--accent); color: var(--accent2); }
.shortcut-key { display: inline-block; background: var(--s3); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-size: 11px; margin: 0 1px; }
.emoji-section-title { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px; }
.emoji-picker-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; margin-bottom: 12px; }
.epick-cell { width: 100%; aspect-ratio: 1; border-radius: 6px; border: none; background: transparent; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: background var(--t); line-height: 1; }
.epick-cell:hover { background: var(--s3); }
.epick-cell.sel { background: rgba(91,127,255,.13); box-shadow: 0 0 0 1.5px var(--accent); }
.color-row { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform var(--t), border-color var(--t); flex-shrink: 0; }
.color-dot:hover { transform: scale(1.15); }
.color-dot.sel { border-color: #fff; transform: scale(1.15); }
.manage-group-row { display: flex; align-items: center; gap: 8px; background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; }

/* ═══ RESPONSIVE ═══ */
@media(max-width:900px) { .news-cards-grid { grid-template-columns: repeat(2, 1fr); } .news-card.hero { grid-column: span 2; } }
@media(max-width:640px) { #sb-sidebar { width: 56px; } .app-btn { width: 40px; height: 40px; } .app-btn::after { display: none; } #hub-panel, #news-panel { padding: 18px 14px; } .app-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); } .news-cards-grid { grid-template-columns: 1fr; } .news-card.hero { grid-column: span 1; grid-row: span 1; } }
```

- [ ] **Step 1.2: Create `frontend/src/dashboard/constants.js`**

```js
export const DEFAULT_GROUPS = [
  { id: 'g_google',    name: 'Google',    color: '#5b7fff' },
  { id: 'g_microsoft', name: 'Microsoft', color: '#38bdf8' },
  { id: 'g_tools',     name: 'Tools',     color: '#a78bfa' },
]

export const DEFAULT_APPS = [
  { id:'gmail',     name:'Gmail',           url:'https://mail.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=mail.google.com',     shortcut:'' },
  { id:'gdocs',     name:'Google Docs',     url:'https://docs.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=docs.google.com',     shortcut:'' },
  { id:'gdrive',    name:'Google Drive',    url:'https://drive.google.com',     groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=drive.google.com',    shortcut:'' },
  { id:'gkeep',     name:'Google Keep',     url:'https://keep.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=keep.google.com',     shortcut:'' },
  { id:'gcal',      name:'Google Calendar', url:'https://calendar.google.com',  groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=calendar.google.com', shortcut:'' },
  { id:'outlook',   name:'Outlook',         url:'https://outlook.live.com',     groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=outlook.live.com',   shortcut:'' },
  { id:'m365',      name:'Microsoft 365',   url:'https://www.microsoft365.com', groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=microsoft365.com',   shortcut:'' },
  { id:'onedrive',  name:'OneDrive',        url:'https://onedrive.live.com',    groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=onedrive.live.com',  shortcut:'' },
  { id:'notion',    name:'Notion',          url:'https://www.notion.so',        groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=notion.so',          shortcut:'' },
  { id:'trello',    name:'Trello',          url:'https://trello.com',           groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=trello.com',         shortcut:'' },
  { id:'slack',     name:'Slack',           url:'https://app.slack.com',        groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=slack.com',          shortcut:'' },
  { id:'chatgpt',   name:'ChatGPT',         url:'https://chat.openai.com',      groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=openai.com',         shortcut:'' },
]

export const GROUP_COLORS = ['#5b7fff','#a78bfa','#3ddcaa','#f5a623','#ff5b6e','#f472b6','#38bdf8','#fb923c','#a3e635','#e2e8f0']

export const EMOJI_LIST = ['📧','📅','📁','📝','🗒️','📊','📈','💬','🔔','⭐','🚀','💡','🔧','🎯','📌','🏠','🌐','🔍','💼','🎨','🛠️','📦','🔒','⚡','🧩','🤖','📱','🖥️','🗂️','✅','🔖','💎','🌟','🎪','🧠','🦊','🐙','🌈','🔥','❄️','🎵','🎬','🏆','💰','🌍','🧪','🎮','🛡️','🏗️','🧬','🎓','🛒','📡','🔭','🧲','🪄','🧩','💻','🗺️','🧭']

export const CATEGORY_COLORS = {
  general: '#5b7fff', sports: '#3ddcaa', tech: '#a78bfa',
  business: '#f5a623', science: '#38bdf8', entertainment: '#f472b6',
}

export const DEFAULT_NEWS_SOURCES = [
  { id:'cnn',       name:'CNN',         url:'https://rss.cnn.com/rss/edition.rss',                        category:'general', color:'#ff5b6e', enabled:true },
  { id:'bbc',       name:'BBC News',    url:'https://feeds.bbci.co.uk/news/rss.xml',                      category:'general', color:'#5b7fff', enabled:true },
  { id:'espn',      name:'ESPN Sports', url:'https://www.espn.com/espn/rss/news',                         category:'sports',  color:'#3ddcaa', enabled:true },
  { id:'marca',     name:'Marca (ES)',  url:'https://e00-marca.uecdn.es/rss/portada.xml',                 category:'sports',  color:'#f5a623', enabled:true },
  { id:'techcrunch',name:'TechCrunch', url:'https://techcrunch.com/feed/',                                category:'tech',    color:'#a78bfa', enabled:true },
  { id:'reuters',   name:'Reuters',    url:'https://feeds.reuters.com/reuters/topNews',                   category:'general', color:'#38bdf8', enabled:true },
]

export const RSS_PRESETS = [
  { name:'Al Jazeera',    url:'https://www.aljazeera.com/xml/rss/all.xml',                            category:'general' },
  { name:'NASA',          url:'https://www.nasa.gov/rss/dyn/breaking_news.rss',                        category:'science' },
  { name:'The Verge',     url:'https://www.theverge.com/rss/index.xml',                               category:'tech'    },
  { name:'NYT Top',       url:'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',            category:'general' },
  { name:'Hacker News',   url:'https://news.ycombinator.com/rss',                                     category:'tech'    },
  { name:"L'Équipe",      url:'https://www.lequipe.fr/rss/actu_rss.xml',                              category:'sports'  },
]
```

- [ ] **Step 1.3: Commit**

```bash
git add frontend/src/dashboard/
git commit -m "feat: add dashboard CSS and constants"
```

---

## Task 2: State hooks

**Files:**
- Create: `frontend/src/dashboard/hooks/useHubState.js`
- Create: `frontend/src/dashboard/hooks/useOpenWindows.js`

- [ ] **Step 2.1: Create `frontend/src/dashboard/hooks/useHubState.js`**

```js
import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_GROUPS, DEFAULT_APPS } from '../constants'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback }
  catch { return fallback }
}

export function useHubState() {
  const [groups, setGroups] = useState(() => load('wsh_groups', DEFAULT_GROUPS))
  const [apps,   setApps]   = useState(() => load('wsh_apps',   DEFAULT_APPS))

  // Persist on every change
  useEffect(() => { localStorage.setItem('wsh_groups', JSON.stringify(groups)) }, [groups])
  useEffect(() => { localStorage.setItem('wsh_apps',   JSON.stringify(apps))   }, [apps])

  const getGroup = useCallback((id) => groups.find(g => g.id === id), [groups])
  const getApp   = useCallback((id) => apps.find(a => a.id === id),   [apps])
  const appsInGroup    = useCallback((gid) => apps.filter(a => a.groupId === gid), [apps])
  const ungroupedApps  = useCallback(() => apps.filter(a => !a.groupId || !groups.find(g => g.id === a.groupId)), [apps, groups])

  const saveApp = useCallback((appData) => {
    setApps(prev => {
      const exists = prev.find(a => a.id === appData.id)
      if (exists) return prev.map(a => a.id === appData.id ? { ...a, ...appData } : a)
      return [...prev, { id: 'app_' + Date.now(), ...appData }]
    })
  }, [])

  const deleteApp = useCallback((id) => {
    setApps(prev => prev.filter(a => a.id !== id))
  }, [])

  const moveApp = useCallback((appId, groupId) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, groupId } : a))
  }, [])

  const reorderApps = useCallback((gid, newOrder) => {
    setApps(prev => {
      const others = prev.filter(a => a.groupId !== gid)
      const reordered = newOrder.map(id => prev.find(a => a.id === id)).filter(Boolean).map(a => ({ ...a, groupId: gid }))
      return [...others.filter(a => !reordered.find(r => r.id === a.id)), ...reordered]
    })
  }, [])

  const saveGroup = useCallback((groupData) => {
    setGroups(prev => {
      const exists = prev.find(g => g.id === groupData.id)
      if (exists) return prev.map(g => g.id === groupData.id ? { ...g, ...groupData } : g)
      return [...prev, { id: 'g_' + Date.now(), ...groupData }]
    })
  }, [])

  const deleteGroup = useCallback((id) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    setApps(prev => prev.map(a => a.groupId === id ? { ...a, groupId: null } : a))
  }, [])

  const moveGroupUp = useCallback((id) => {
    setGroups(prev => {
      const i = prev.findIndex(g => g.id === id)
      if (i <= 0) return prev
      const next = [...prev]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; return next
    })
  }, [])

  const moveGroupDown = useCallback((id) => {
    setGroups(prev => {
      const i = prev.findIndex(g => g.id === id)
      if (i < 0 || i >= prev.length - 1) return prev
      const next = [...prev]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; return next
    })
  }, [])

  return {
    groups, apps, getGroup, getApp, appsInGroup, ungroupedApps,
    saveApp, deleteApp, moveApp, reorderApps,
    saveGroup, deleteGroup, moveGroupUp, moveGroupDown,
  }
}
```

- [ ] **Step 2.2: Create `frontend/src/dashboard/hooks/useOpenWindows.js`**

```js
import { useRef, useState, useCallback, useEffect } from 'react'

export function useOpenWindows() {
  const winRefs = useRef({}) // { appId: { win: Window } }
  const [openIds, setOpenIds] = useState(new Set())

  // Poll every 1.5s for closed windows
  useEffect(() => {
    const timer = setInterval(() => {
      const refs = winRefs.current
      let changed = false
      Object.keys(refs).forEach(id => {
        if (refs[id]?.win?.closed) {
          delete refs[id]
          changed = true
        }
      })
      if (changed) setOpenIds(new Set(Object.keys(winRefs.current)))
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const openApp = useCallback((app) => {
    const ref = winRefs.current[app.id]
    if (ref?.win && !ref.win.closed) {
      try { ref.win.focus() } catch {}
      setOpenIds(prev => new Set([...prev, app.id]))
      return
    }
    const win = window.open(app.url, 'wshub_' + app.id)
    if (win) {
      winRefs.current[app.id] = { win }
      try { win.focus() } catch {}
      setOpenIds(prev => new Set([...prev, app.id]))
    } else {
      if (confirm(`Popup blocked for "${app.name}". Allow popups then retry.\n\nOpen directly?`)) {
        window.open(app.url, 'wshub_' + app.id)
      }
    }
  }, [])

  const isOpen = useCallback((id) => openIds.has(id), [openIds])

  return { openApp, isOpen }
}
```

- [ ] **Step 2.3: Commit**

```bash
git add frontend/src/dashboard/hooks/
git commit -m "feat: add useHubState and useOpenWindows hooks"
```

---

## Task 3: Sidebar component

**Files:**
- Create: `frontend/src/dashboard/Sidebar.jsx`

- [ ] **Step 3.1: Create `frontend/src/dashboard/Sidebar.jsx`**

```jsx
function AppIcon({ app }) {
  if (app.emoji) return <span style={{ fontSize: 22, lineHeight: '26px', display: 'block', textAlign: 'center' }}>{app.emoji}</span>
  const src = app.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(tryHost(app.url))}`
  return <img src={src} alt="" style={{ width: 26, height: 26, borderRadius: 5, display: 'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:18px">🌐</span>' }} />
}

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

export default function Sidebar({ groups, apps, openApp, isOpen, onAddApp, onContextMenu }) {
  function appsInGroup(gid) { return apps.filter(a => a.groupId === gid) }
  function ungrouped() { return apps.filter(a => !a.groupId || !groups.find(g => g.id === a.groupId)) }

  return (
    <nav id="sb-sidebar">
      <div className="sb-logo" title="CloudDesktop Workspace">CW</div>
      <div className="sb-sep" />

      {groups.map(g => {
        const ga = appsInGroup(g.id)
        if (!ga.length) return null
        return (
          <div key={g.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
            <div className="sb-group-label" style={{ color: g.color, borderTop: `1px solid ${g.color}22`, paddingTop: 6, marginTop: 2 }}>
              {g.name.slice(0, 3).toUpperCase()}
            </div>
            {ga.map(app => (
              <button
                key={app.id}
                className={`app-btn${isOpen(app.id) ? ' is-open' : ''}`}
                data-tip={app.name + (app.shortcut ? ` [${app.shortcut}]` : '')}
                onClick={() => openApp(app)}
                onContextMenu={e => { e.preventDefault(); onContextMenu(e, app.id) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <AppIcon app={app} />
                </div>
                <span className="odot" />
              </button>
            ))}
          </div>
        )
      })}

      {ungrouped().length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
          <div className="sb-group-label">OTHER</div>
          {ungrouped().map(app => (
            <button
              key={app.id}
              className={`app-btn${isOpen(app.id) ? ' is-open' : ''}`}
              data-tip={app.name}
              onClick={() => openApp(app)}
              onContextMenu={e => { e.preventDefault(); onContextMenu(e, app.id) }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <AppIcon app={app} />
              </div>
              <span className="odot" />
            </button>
          ))}
        </div>
      )}

      <div className="sb-spacer" />
      <div className="sb-sep" />
      <button className="sb-add-btn" title="Add App (Ctrl+K)" onClick={onAddApp}>+</button>
    </nav>
  )
}
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/dashboard/Sidebar.jsx
git commit -m "feat: add Sidebar component"
```

---

## Task 4: ContextMenu component

**Files:**
- Create: `frontend/src/dashboard/ContextMenu.jsx`

- [ ] **Step 4.1: Create `frontend/src/dashboard/ContextMenu.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'

export default function ContextMenu({ ctx, groups, onClose, onOpen, onEdit, onDelete, onMoveToGroup, onNewGroup }) {
  const ref = useRef(null)
  const [showMove, setShowMove] = useState(false)

  // Close on outside click or Escape
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function keyHandler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler) }
  }, [onClose])

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    if (r.right > window.innerWidth) ref.current.style.left = (window.innerWidth - r.width - 8) + 'px'
    if (r.bottom > window.innerHeight) ref.current.style.top = (window.innerHeight - r.height - 8) + 'px'
  })

  if (!ctx) return null
  const { x, y, appId, appName, isOpen: appIsOpen } = ctx

  if (showMove) {
    return (
      <div ref={ref} className="ctx-menu" style={{ left: x, top: y }}>
        <div className="ctx-header">Move to group</div>
        {groups.map(g => (
          <div key={g.id} className="ctx-item" onClick={() => { onMoveToGroup(appId, g.id); onClose() }}>
            <span className="ctx-ico" style={{ color: g.color }}>●</span>{g.name}
          </div>
        ))}
        <div className="ctx-sep" />
        <div className="ctx-item" onClick={() => { onNewGroup(appId); onClose() }}>
          <span className="ctx-ico">+</span>New group…
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="ctx-menu" style={{ left: x, top: y }}>
      <div className="ctx-header">{appName}</div>
      <div className="ctx-item" onClick={() => { onOpen(appId); onClose() }}>
        <span className="ctx-ico">{appIsOpen ? '↗' : '🚀'}</span>{appIsOpen ? 'Focus tab' : 'Open app'}
      </div>
      <div className="ctx-sep" />
      <div className="ctx-item" onClick={() => { onEdit(appId); onClose() }}>
        <span className="ctx-ico">✎</span>Edit app
      </div>
      <div className="ctx-item" onClick={() => { onEdit(appId, 'icon'); onClose() }}>
        <span className="ctx-ico">🎨</span>Change icon
      </div>
      <div className="ctx-item" onClick={() => { onEdit(appId, 'shortcut'); onClose() }}>
        <span className="ctx-ico">⌨</span>Set shortcut
      </div>
      <div className="ctx-sep" />
      <div className="ctx-item" onClick={() => setShowMove(true)}>
        <span className="ctx-ico">⊞</span>Move to group
      </div>
      <div className="ctx-sep" />
      <div className="ctx-item danger" onClick={() => { onDelete(appId); onClose() }}>
        <span className="ctx-ico">🗑</span>Delete app
      </div>
    </div>
  )
}
```

- [ ] **Step 4.2: Commit**

```bash
git add frontend/src/dashboard/ContextMenu.jsx
git commit -m "feat: add ContextMenu component"
```

---

## Task 5: AppModal component

**Files:**
- Create: `frontend/src/dashboard/AppModal.jsx`

- [ ] **Step 5.1: Create `frontend/src/dashboard/AppModal.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react'
import { EMOJI_LIST, GROUP_COLORS } from './constants'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function isValidUrl(s) { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }

function renderShortcutText(sc) {
  if (!sc) return <span style={{ color: 'var(--text3)' }}>None</span>
  return sc.split('+').map((k, i) => (
    <span key={i}><span className="shortcut-key">{k}</span>{i < sc.split('+').length - 1 ? '+' : ''}</span>
  ))
}

export default function AppModal({ app, groups, onSave, onDelete, onClose }) {
  const isNew = !app?.id || app.id === '__new__'
  const [name, setName]     = useState(app?.name || '')
  const [url, setUrl]       = useState(app?.url || '')
  const [groupId, setGroupId] = useState(app?.groupId || groups[0]?.id || '')
  const [iconVal, setIconVal] = useState(app?.emoji || '')
  const [shortcut, setShortcut] = useState(app?.shortcut || '')
  const [listening, setListening] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    if (app?.focusField === 'icon') document.getElementById('ae-icon-input')?.focus()
    else if (app?.focusField === 'shortcut') setListening(true)
    else setTimeout(() => nameRef.current?.focus(), 80)
  }, [])

  // Keyboard shortcut capture
  useEffect(() => {
    if (!listening) return
    function handler(e) {
      e.preventDefault(); e.stopPropagation()
      if (e.key === 'Escape') { setListening(false); return }
      if (['Control','Alt','Shift','Meta'].includes(e.key)) return
      const parts = []
      if (e.ctrlKey) parts.push('Ctrl'); if (e.metaKey) parts.push('Cmd')
      if (e.altKey) parts.push('Alt'); if (e.shiftKey) parts.push('Shift')
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      setShortcut(parts.join('+'))
      setListening(false)
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [listening])

  function previewIcon() {
    if (iconVal.startsWith('http')) return <img src={iconVal} style={{ width: 28, height: 28, borderRadius: 6 }} alt="" onError={e => { e.target.outerHTML = '<span>🌐</span>' }} />
    if (iconVal) return <span style={{ fontSize: 24 }}>{iconVal}</span>
    if (url) { try { return <img src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(url).hostname)}`} style={{ width: 28, height: 28, borderRadius: 6 }} alt="" onError={e => { e.target.outerHTML = '<span>🌐</span>' }} /> } catch {} }
    return <span>🌐</span>
  }

  function handleSave() {
    if (!name.trim()) { document.getElementById('ae-name').style.borderColor = 'var(--red)'; setTimeout(() => document.getElementById('ae-name').style.borderColor = '', 900); return }
    if (!url.trim() || !isValidUrl(url.trim())) { document.getElementById('ae-url').style.borderColor = 'var(--red)'; setTimeout(() => document.getElementById('ae-url').style.borderColor = '', 900); return }
    let emoji = null, favicon = null
    if (iconVal.startsWith('http')) favicon = iconVal
    else if (iconVal) emoji = iconVal
    else { try { favicon = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(url).hostname)}` } catch {} }
    onSave({ id: app?.id || '__new__', name: name.trim(), url: url.trim(), groupId: groupId || null, emoji, favicon, shortcut })
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-title">{isNew ? 'Add App' : 'Edit App'}</div>
        <div className="modal-sub">{isNew ? 'Fill in the details below.' : 'Changes save when you click Save.'}</div>
        <div className="modal-preview">
          <div className="modal-preview-icon">{previewIcon()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-preview-name">{name || 'App Name'}</div>
            <div className="modal-preview-url">{url || 'https://…'}</div>
            {shortcut && <div className="modal-preview-shortcut">⌨ {shortcut}</div>}
          </div>
        </div>
        <div className="field"><label>App Name</label><input id="ae-name" ref={nameRef} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Gmail, Notion…" maxLength={40} /></div>
        <div className="field"><label>URL</label><input id="ae-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></div>
        <div className="field">
          <label>Group</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '9px 12px', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            <option value="">— No group —</option>
          </select>
        </div>
        <div className="field"><label>Icon — emoji or image URL</label><input id="ae-icon-input" type="text" value={iconVal} onChange={e => setIconVal(e.target.value)} placeholder="🚀 or https://…" maxLength={200} /></div>
        <div className="emoji-section-title">Quick pick</div>
        <div className="emoji-picker-grid">
          {EMOJI_LIST.map(em => (
            <button key={em} type="button" className={`epick-cell${iconVal === em ? ' sel' : ''}`} onClick={() => setIconVal(iconVal === em ? '' : em)}>{em}</button>
          ))}
        </div>
        <div className="field">
          <label>Keyboard Shortcut <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <div className={`shortcut-capture${listening ? ' listening' : ''}`} tabIndex={0} onClick={() => setListening(!listening)}>
            <span>{listening ? 'Press keys…' : renderShortcutText(shortcut)}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>{listening ? 'Esc to cancel' : 'click to set'}</span>
          </div>
        </div>
        <div className="modal-actions">
          {!isNew && <button className="btn-danger" onClick={() => { if (window.confirm('Delete this app?')) onDelete(app.id) }}>Delete</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: Commit**

```bash
git add frontend/src/dashboard/AppModal.jsx
git commit -m "feat: add AppModal with emoji picker and shortcut recorder"
```

---

## Task 6: GroupModal + ManageGroupsModal

**Files:**
- Create: `frontend/src/dashboard/GroupModal.jsx`
- Create: `frontend/src/dashboard/ManageGroupsModal.jsx`

- [ ] **Step 6.1: Create `frontend/src/dashboard/GroupModal.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { GROUP_COLORS } from './constants'

export default function GroupModal({ group, onSave, onDelete, onClose }) {
  const isNew = !group?.id
  const [name, setName] = useState(group?.name || '')
  const [color, setColor] = useState(group?.color || GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)])

  useEffect(() => { setTimeout(() => document.getElementById('gm-name')?.focus(), 80) }, [])

  function handleSave() {
    if (!name.trim()) {
      const el = document.getElementById('gm-name')
      if (el) { el.style.borderColor = 'var(--red)'; setTimeout(() => el.style.borderColor = '', 900) }
      return
    }
    onSave({ id: group?.id, name: name.trim(), color })
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 400 }}>
        <div className="modal-title">{isNew ? 'New Group' : 'Edit Group'}</div>
        <div className="modal-sub">Groups appear in the dashboard and sidebar.</div>
        <div className="field"><label>Group Name</label><input id="gm-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Work, Personal, Dev…" maxLength={32} /></div>
        <div className="field">
          <label>Color</label>
          <div className="color-row">
            {GROUP_COLORS.map(c => (
              <div key={c} className={`color-dot${color === c ? ' sel' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          {!isNew && <button className="btn-danger" onClick={() => { if (window.confirm('Delete group? Apps become ungrouped.')) onDelete(group.id) }}>Delete Group</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.2: Create `frontend/src/dashboard/ManageGroupsModal.jsx`**

```jsx
export default function ManageGroupsModal({ groups, apps, onEdit, onNew, onMoveUp, onMoveDown, onClose }) {
  function appsInGroup(gid) { return apps.filter(a => a.groupId === gid).length }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 400 }}>
        <div className="modal-title">Manage Groups</div>
        <div className="modal-sub">Reorder, rename or delete your groups.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {groups.length === 0 && (
            <div style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 12, textAlign: 'center', padding: 16 }}>No groups yet.</div>
          )}
          {groups.map((g, i) => (
            <div key={g.id} className="manage-group-row">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>{appsInGroup(g.id)} apps</div>
              <button className="dash-group-btn" onClick={() => onEdit(g.id)}>✎ Edit</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button className="dash-group-btn" style={{ padding: '1px 6px', fontSize: 10, opacity: i === 0 ? .3 : 1 }} disabled={i === 0} onClick={() => onMoveUp(g.id)}>▲</button>
                <button className="dash-group-btn" style={{ padding: '1px 6px', fontSize: 10, opacity: i === groups.length - 1 ? .3 : 1 }} disabled={i === groups.length - 1} onClick={() => onMoveDown(g.id)}>▼</button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" style={{ background: 'rgba(91,127,255,.13)', borderColor: 'var(--accent)', color: 'var(--accent2)' }} onClick={onNew}>+ New Group</button>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.3: Commit**

```bash
git add frontend/src/dashboard/GroupModal.jsx frontend/src/dashboard/ManageGroupsModal.jsx
git commit -m "feat: add GroupModal and ManageGroupsModal"
```

---

## Task 7: AppsTab component

**Files:**
- Create: `frontend/src/dashboard/AppsTab.jsx`

- [ ] **Step 7.1: Create `frontend/src/dashboard/AppsTab.jsx`**

```jsx
import { useRef } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function AppIcon({ app }) {
  if (app.emoji) return <span style={{ fontSize: 21 }}>{app.emoji}</span>
  const src = app.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(tryHost(app.url))}`
  return <img src={src} alt="" style={{ width: 26, height: 26, borderRadius: 5, display: 'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:18px">🌐</span>' }} />
}

function AppCard({ app, isOpen, onOpen, onContextMenu }) {
  const open = isOpen(app.id)
  return (
    <div
      className={`app-card${open ? ' is-open' : ''}`}
      data-id={app.id}
      draggable
      onClick={() => onOpen(app)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, app.id) }}
    >
      <div className="card-icon"><AppIcon app={app} /></div>
      <div>
        <div className="card-name">{app.name}</div>
        <div className="card-url">{tryHost(app.url)}</div>
        {app.shortcut && <div className="card-shortcut">⌨ {app.shortcut}</div>}
      </div>
      <div className="card-footer">
        <div className={`card-status${open ? ' open' : ''}`}>
          <span className="dot" />{open ? 'Open' : 'Closed'}
        </div>
        <button className="card-action-btn" onClick={e => { e.stopPropagation(); onOpen(app) }}>
          {open ? 'Focus ↗' : 'Open ↗'}
        </button>
      </div>
    </div>
  )
}

function GroupSection({ group, apps, isOpen, onOpen, onContextMenu, onAddApp, onEditGroup, onReorder }) {
  const dragRef = useRef(null)

  function handleDragStart(e, id) { dragRef.current = id; e.currentTarget.classList.add('dragging') }
  function handleDragEnd(e, gid) {
    e.currentTarget.classList.remove('dragging')
    const grid = e.currentTarget.closest('.app-grid')
    if (!grid) return
    const newOrder = [...grid.querySelectorAll('.app-card')].map(c => c.dataset.id).filter(Boolean)
    onReorder(gid, newOrder)
    dragRef.current = null
  }
  function handleDragOver(e, id) {
    e.preventDefault()
    if (!dragRef.current || dragRef.current === id) return
  }
  function handleDrop(e, targetId, gid) {
    e.preventDefault()
    const sourceId = dragRef.current
    if (!sourceId || sourceId === targetId) return
    const sourceIdx = apps.findIndex(a => a.id === sourceId)
    const targetIdx = apps.findIndex(a => a.id === targetId)
    if (sourceIdx < 0 || targetIdx < 0) return
    const newOrder = apps.map(a => a.id)
    newOrder.splice(sourceIdx, 1)
    newOrder.splice(targetIdx, 0, sourceId)
    onReorder(gid, newOrder)
  }

  return (
    <div className="dash-group">
      <div className="dash-group-header">
        <div className="dash-group-color" style={{ background: group.color }} />
        <div className="dash-group-name">{group.name}</div>
        <div className="dash-group-count">{apps.length} app{apps.length !== 1 ? 's' : ''}</div>
        <div className="dash-group-spacer" />
        <div className="dash-group-actions">
          <button className="dash-group-btn" onClick={() => onAddApp(group.id)}>+ Add App</button>
          <button className="dash-group-btn" onClick={() => onEditGroup(group.id)}>✎ Edit</button>
        </div>
      </div>
      <div className="app-grid">
        {apps.map(app => (
          <div
            key={app.id}
            data-id={app.id}
            draggable
            onDragStart={e => handleDragStart(e, app.id)}
            onDragEnd={e => handleDragEnd(e, group.id)}
            onDragOver={e => handleDragOver(e, app.id)}
            onDrop={e => handleDrop(e, app.id, group.id)}
          >
            <AppCard app={app} isOpen={isOpen} onOpen={onOpen} onContextMenu={onContextMenu} />
          </div>
        ))}
        <div className="add-card" onClick={() => onAddApp(group.id)}>
          <div className="add-card-icon">+</div>
          <div className="add-card-label">Add App</div>
        </div>
      </div>
    </div>
  )
}

export default function AppsTab({ groups, apps, isOpen, openApp, onContextMenu, onAddApp, onEditGroup, onManageGroups, onOpenAll, onReorder }) {
  function appsInGroup(gid) { return apps.filter(a => a.groupId === gid) }
  function ungrouped() { return apps.filter(a => !a.groupId || !groups.find(g => g.id === a.groupId)) }
  const ung = ungrouped()

  return (
    <div id="hub-panel">
      <div className="dash-hero">
        <div className="dash-logo">WH</div>
        <div>
          <h1>CloudDesktop Workspace</h1>
          <p>Click an app to open it · Right-click to edit · Drag to reorder</p>
        </div>
      </div>
      {groups.map(g => {
        const ga = appsInGroup(g.id)
        return (
          <GroupSection
            key={g.id}
            group={g}
            apps={ga}
            isOpen={isOpen}
            onOpen={openApp}
            onContextMenu={onContextMenu}
            onAddApp={onAddApp}
            onEditGroup={onEditGroup}
            onReorder={onReorder}
          />
        )
      })}
      {ung.length > 0 && (
        <div className="dash-group">
          <div className="dash-group-header">
            <div className="dash-group-color" style={{ background: 'var(--text3)' }} />
            <div className="dash-group-name">Ungrouped</div>
            <div className="dash-group-spacer" />
          </div>
          <div className="app-grid">
            {ung.map(app => <AppCard key={app.id} app={app} isOpen={isOpen} onOpen={openApp} onContextMenu={onContextMenu} />)}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7.2: Commit**

```bash
git add frontend/src/dashboard/AppsTab.jsx
git commit -m "feat: add AppsTab with drag-to-reorder"
```

---

## Task 8: NewsTab + SourceModal

**Files:**
- Create: `frontend/src/dashboard/NewsTab.jsx`
- Create: `frontend/src/dashboard/SourceModal.jsx`

- [ ] **Step 8.1: Create `frontend/src/dashboard/SourceModal.jsx`**

```jsx
import { useState } from 'react'
import { CATEGORY_COLORS, RSS_PRESETS } from './constants'

export default function SourceModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('general')

  function handleSave() {
    if (!name.trim() || !url.trim()) return
    const color = CATEGORY_COLORS[category] || '#5b7fff'
    onSave({ id: 'src_' + Date.now(), name: name.trim(), url: url.trim(), category, color, enabled: true })
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 420 }}>
        <div className="modal-title">Add News Source</div>
        <div className="modal-sub">Paste an RSS feed URL. Fetched via CORS proxy.</div>
        <div className="field"><label>Source Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reuters, Al Jazeera…" maxLength={40} autoFocus /></div>
        <div className="field"><label>RSS Feed URL</label><input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://feeds.example.com/rss" /></div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '9px 12px', cursor: 'pointer', appearance: 'none' }}>
            {['general','sports','tech','business','science','entertainment'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.07em' }}>Quick presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {RSS_PRESETS.map(p => (
              <div key={p.name} onClick={() => { setName(p.name); setUrl(p.url); setCategory(p.category) }}
                style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text2)', cursor: 'pointer' }}>
                {p.name}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Add Source</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8.2: Create `frontend/src/dashboard/NewsTab.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_NEWS_SOURCES, CATEGORY_COLORS } from './constants'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function stripTags(s) { return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
function decodeEntities(s) { const t = document.createElement('textarea'); t.innerHTML = s; return t.value }
function extractImg(html) { const m = html.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i); return m ? m[1] : '' }
function formatAge(dateStr) {
  try {
    const d = new Date(dateStr); if (isNaN(d)) return ''
    const m = Math.round((Date.now() - d.getTime()) / 60000)
    if (m < 2) return 'just now'; if (m < 60) return `${m}m ago`
    const h = Math.round(m / 60); if (h < 24) return `${h}h ago`
    return `${Math.round(h / 24)}d ago`
  } catch { return '' }
}

async function fetchWithTimeout(url, ms) {
  return fetch(url, { signal: AbortSignal.timeout(ms) })
}

function parseRSSXML(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const isAtom = !!doc.querySelector('feed')
  const items = [...doc.querySelectorAll(isAtom ? 'entry' : 'item')]
  return items.slice(0, 5).map(item => {
    const txt = sel => item.querySelector(sel)?.textContent?.trim() || ''
    const attr = (sel, a) => item.querySelector(sel)?.getAttribute(a) || ''
    const rawDesc = item.querySelector('description')?.textContent || txt('summary') || txt('content')
    return {
      title: decodeEntities(txt('title')),
      link: attr('link', 'href') || txt('link') || txt('guid') || '',
      desc: decodeEntities(stripTags(rawDesc)).slice(0, 220),
      image: attr('enclosure[type^="image"]', 'url') || attr('thumbnail', 'url') || extractImg(rawDesc) || '',
      pubDate: txt('pubDate') || txt('published') || '',
      category: txt('category'),
    }
  }).filter(i => i.title && i.link)
}

async function fetchRSS(src) {
  const rss2json = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}&count=5`
  try {
    const r = await fetchWithTimeout(rss2json, 8000)
    if (r.ok) {
      const d = await r.json()
      if (d.status === 'ok' && Array.isArray(d.items) && d.items.length) {
        return d.items.slice(0, 5).map(it => ({
          title: decodeEntities(stripTags(it.title || '')),
          link: it.link || it.guid || '',
          desc: decodeEntities(stripTags(it.description || it.content || '')).slice(0, 220),
          image: it.enclosure?.link || it.thumbnail || extractImg(it.description || '') || '',
          pubDate: it.pubDate || '',
          category: Array.isArray(it.categories) ? it.categories[0] || '' : '',
        })).filter(i => i.title && i.link)
      }
    }
  } catch {}
  try {
    const r = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(src.url)}&timestamp=${Date.now()}`, 9000)
    if (r.ok) { const d = await r.json(); if (d?.contents?.length > 300) return parseRSSXML(d.contents) }
  } catch {}
  try {
    const r = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(src.url)}`, 9000)
    if (r.ok) { const t = await r.text(); if (t.length > 300) return parseRSSXML(t) }
  } catch {}
  throw new Error('All fetch strategies failed')
}

function NewsCard({ item, src, isHero }) {
  return (
    <a className={`news-card${isHero ? ' hero' : ''}`} href={item.link} target="_blank" rel="noopener noreferrer">
      <div className="news-card-img">
        {item.image
          ? <img src={item.image} alt="" loading="lazy" onError={e => { e.target.parentNode.innerHTML = '<div class="img-placeholder"><span>No image</span></div>' }} />
          : <div className="img-placeholder"><span>No image</span></div>
        }
      </div>
      <div className="news-card-body">
        {item.category && <div className="news-card-category">{item.category}</div>}
        <div className="news-card-title">{item.title}</div>
        {isHero && item.desc && <div className="news-card-desc">{item.desc}</div>}
        <div className="news-card-meta">
          {item.pubDate && <span>{formatAge(item.pubDate)}</span>}
          <span className="news-card-source-tag" style={{ color: src.color }}>{src.name}</span>
        </div>
      </div>
    </a>
  )
}

function SkeletonCard({ isHero }) {
  return (
    <div className={`news-card${isHero ? ' hero' : ''}`} style={{ cursor: 'default' }}>
      <div className="news-card-img skeleton" />
      <div className="news-card-body" style={{ gap: 7 }}>
        <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 13, width: '90%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 13, width: '75%', borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function NewsTab({ sources, onSourcesChange, onAddSource }) {
  const [cache, setCache] = useState({})
  const [filter, setFilter] = useState('all')
  const [spinning, setSpinning] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Fetching latest headlines…')

  const fetchAll = useCallback(async (force = false) => {
    setSpinning(true)
    setLastUpdated('Fetching headlines…')
    const newCache = force ? {} : { ...cache }
    await Promise.allSettled(
      sources.map(async src => {
        if (newCache[src.id] && !force) return
        try { newCache[src.id] = await fetchRSS(src) }
        catch (e) { newCache[src.id] = { error: true, message: e.message } }
      })
    )
    setCache({ ...newCache })
    const now = new Date()
    setLastUpdated(`Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${sources.length} source${sources.length !== 1 ? 's' : ''}`)
    setSpinning(false)
  }, [sources, cache])

  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = filter === 'all' ? sources : sources.filter(s => s.id === filter)

  function removeSource(id) {
    if (!window.confirm(`Remove this source?`)) return
    onSourcesChange(sources.filter(s => s.id !== id))
    setCache(c => { const n = { ...c }; delete n[id]; return n })
    if (filter === id) setFilter('all')
  }

  return (
    <div id="news-panel">
      <div className="news-header">
        <div>
          <h1>📰 Today's News</h1>
          <p>{lastUpdated}</p>
        </div>
        <div className="news-header-right">
          <button className={`news-refresh-btn${spinning ? ' spinning' : ''}`} onClick={() => fetchAll(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 2v4H7"/><path d="M1 10V6h4"/><path d="M10.5 6A4.5 4.5 0 002.2 3.2"/><path d="M1.5 6a4.5 4.5 0 008.3 2.8"/>
            </svg>
            Refresh
          </button>
          <button className="news-add-source-btn" onClick={onAddSource}>+ Source</button>
        </div>
      </div>

      <div className="source-pills">
        <div className={`source-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          <span className="pill-dot" style={{ background: 'var(--accent)' }} />All Sources
        </div>
        {sources.map(src => (
          <div key={src.id} className={`source-pill${filter === src.id ? ' active' : ''}`} onClick={() => setFilter(src.id)}>
            <span className="pill-dot" style={{ background: src.color }} />
            {src.name}
            <button className="pill-remove" onClick={e => { e.stopPropagation(); removeSource(src.id) }}>×</button>
          </div>
        ))}
      </div>

      {displayed.map(src => {
        const items = cache[src.id]
        const favicon = `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(tryHost(src.url))}`
        return (
          <div key={src.id} className="news-source-section">
            <div className="news-source-header">
              <div className="news-source-logo">
                <img src={favicon} alt="" onError={e => { e.target.outerHTML = '📰' }} />
              </div>
              <div>
                <div className="news-source-name" style={{ color: src.color }}>{src.name}</div>
                <div className="news-source-url">{tryHost(src.url)}</div>
              </div>
              <div className="news-source-spacer" />
              <button className="news-open-source-btn" onClick={() => window.open(src.url.split('/rss')[0] || src.url, '_blank')}>Visit site ↗</button>
            </div>
            <div className="news-cards-grid">
              {!items && [0,1,2,3,4].map(n => <SkeletonCard key={n} isHero={n===0} />)}
              {items?.error && (
                <div className="news-error" style={{ gridColumn: '1/-1' }}>
                  ⚠ Could not fetch "{src.name}": {items.message}.{' '}
                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)', marginLeft: 6 }}>Try RSS directly ↗</a>
                </div>
              )}
              {Array.isArray(items) && items.map((item, i) => (
                <NewsCard key={item.link} item={item} src={src} isHero={i === 0} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 8.3: Commit**

```bash
git add frontend/src/dashboard/NewsTab.jsx frontend/src/dashboard/SourceModal.jsx
git commit -m "feat: add NewsTab with RSS fetching and SourceModal"
```

---

## Task 9: DashboardPage — full orchestrator

**Files:**
- Replace: `frontend/src/pages/DashboardPage.jsx`

- [ ] **Step 9.1: Replace `frontend/src/pages/DashboardPage.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHubState } from '../dashboard/hooks/useHubState'
import { useOpenWindows } from '../dashboard/hooks/useOpenWindows'
import { DEFAULT_NEWS_SOURCES } from '../dashboard/constants'
import Sidebar from '../dashboard/Sidebar'
import AppsTab from '../dashboard/AppsTab'
import NewsTab from '../dashboard/NewsTab'
import ContextMenu from '../dashboard/ContextMenu'
import AppModal from '../dashboard/AppModal'
import GroupModal from '../dashboard/GroupModal'
import ManageGroupsModal from '../dashboard/ManageGroupsModal'
import SourceModal from '../dashboard/SourceModal'
import '../dashboard/dashboard.css'

function loadNewsSources() {
  try { return JSON.parse(localStorage.getItem('wsh_news_sources')) || JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
  catch { return JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
}

export default function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const hub = useHubState()
  const { openApp, isOpen } = useOpenWindows()

  const [activeTab, setActiveTab] = useState('news')
  const [sources, setSources] = useState(loadNewsSources)
  const [ctx, setCtx] = useState(null)                    // context menu state
  const [appModal, setAppModal] = useState(null)          // null | { app, focusField }
  const [groupModal, setGroupModal] = useState(null)      // null | group object | 'new'
  const [showManage, setShowManage] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)

  // Persist news sources
  useEffect(() => { localStorage.setItem('wsh_news_sources', JSON.stringify(sources)) }, [sources])

  // Global keyboard shortcuts
  useEffect(() => {
    function handler(e) {
      if (appModal || groupModal || showManage) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openAddApp(); return }
      if (e.key === 'Escape') { setCtx(null); return }
      const parts = []
      if (e.ctrlKey) parts.push('Ctrl'); if (e.metaKey) parts.push('Cmd')
      if (e.altKey) parts.push('Alt'); if (e.shiftKey) parts.push('Shift')
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      const sc = parts.join('+')
      const match = hub.apps.find(a => a.shortcut === sc)
      if (match) { e.preventDefault(); openApp(match) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [hub.apps, appModal, groupModal, showManage, openApp])

  // Context menu handlers
  function handleContextMenu(e, appId) {
    const app = hub.getApp(appId)
    if (!app) return
    setCtx({ x: e.clientX + 4, y: e.clientY + 4, appId, appName: app.name, isOpen: isOpen(appId) })
  }

  function handleCtxMoveToGroup(appId, groupId) {
    hub.moveApp(appId, groupId)
    setCtx(null)
  }

  function handleCtxNewGroup(appId) {
    setGroupModal({ id: null, _pendingAppId: appId })
  }

  // App modal handlers
  function openAddApp(defaultGroupId) {
    setAppModal({ app: { id: '__new__', name: '', url: '', groupId: defaultGroupId || hub.groups[0]?.id || '', emoji: null, favicon: '', shortcut: '' } })
  }

  function openEditApp(appId, focusField) {
    const app = hub.getApp(appId)
    if (app) setAppModal({ app: { ...app }, focusField })
  }

  function handleSaveApp(data) {
    hub.saveApp(data)
    setAppModal(null)
  }

  function handleDeleteApp(id) {
    hub.deleteApp(id)
    setAppModal(null)
  }

  // Group modal handlers
  function handleSaveGroup(data) {
    const pendingAppId = groupModal?._pendingAppId
    // Generate ID upfront so we can use it synchronously for moveApp
    const newId = data.id || ('g_' + Date.now())
    hub.saveGroup({ ...data, id: newId })
    if (pendingAppId && !data.id) {
      hub.moveApp(pendingAppId, newId)
    }
    setGroupModal(null)
    setShowManage(false)
  }

  function handleDeleteGroup(id) {
    hub.deleteGroup(id)
    setGroupModal(null)
    setShowManage(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const tabActions = {
    news: (
      <>
        <button className="news-refresh-btn" onClick={() => { /* NewsTab handles its own refresh via prop */ }}>
        </button>
      </>
    ),
    hub: (
      <>
        <button className="tb-btn" onClick={() => setShowManage(true)}>⊞ Groups</button>
        <button className="tb-btn" onClick={() => openAddApp()}>+ Add App</button>
        <button className="open-all-btn" onClick={() => hub.apps.forEach((app, i) => setTimeout(() => openApp(app), i * 100))}>⚡ Open All</button>
      </>
    ),
  }

  return (
    <div id="dashboard-root">
      <Sidebar
        groups={hub.groups}
        apps={hub.apps}
        openApp={openApp}
        isOpen={isOpen}
        onAddApp={() => openAddApp()}
        onContextMenu={handleContextMenu}
      />

      <div id="db-main">
        {/* Tab bar */}
        <div id="tabs-bar">
          <button className={`tab-btn${activeTab === 'news' ? ' active' : ''}`} onClick={() => setActiveTab('news')}>
            <span>📰</span>News
          </button>
          <div className="tab-divider" />
          <button className={`tab-btn${activeTab === 'hub' ? ' active' : ''}`} onClick={() => setActiveTab('hub')}>
            <span>⚡</span>Apps
          </button>
          <div className="tab-spacer" />
          <div className="tab-actions">
            {activeTab === 'news' && (
              <button className="news-add-source-btn" onClick={() => setShowSourceModal(true)}>+ Source</button>
            )}
            {activeTab === 'hub' && (
              <>
                <button className="tb-btn" onClick={() => setShowManage(true)}>⊞ Groups</button>
                <button className="tb-btn" onClick={() => openAddApp()}>+ Add App</button>
                <button className="open-all-btn" onClick={() => hub.apps.forEach((app, i) => setTimeout(() => openApp(app), i * 100))}>⚡ Open All</button>
              </>
            )}
            <button className="tb-btn" onClick={handleLogout} style={{ marginLeft: 8 }}>Log out</button>
          </div>
        </div>

        {/* Tab panels */}
        {activeTab === 'news' && (
          <div className="tab-panel">
            <NewsTab
              sources={sources}
              onSourcesChange={setSources}
              onAddSource={() => setShowSourceModal(true)}
            />
          </div>
        )}
        {activeTab === 'hub' && (
          <div className="tab-panel">
            <AppsTab
              groups={hub.groups}
              apps={hub.apps}
              isOpen={isOpen}
              openApp={openApp}
              onContextMenu={handleContextMenu}
              onAddApp={openAddApp}
              onEditGroup={(id) => setGroupModal(hub.getGroup(id))}
              onManageGroups={() => setShowManage(true)}
              onOpenAll={() => hub.apps.forEach((app, i) => setTimeout(() => openApp(app), i * 100))}
              onReorder={hub.reorderApps}
            />
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctx && (
        <ContextMenu
          ctx={ctx}
          groups={hub.groups}
          onClose={() => setCtx(null)}
          onOpen={(id) => openApp(hub.getApp(id))}
          onEdit={openEditApp}
          onDelete={handleDeleteApp}
          onMoveToGroup={handleCtxMoveToGroup}
          onNewGroup={handleCtxNewGroup}
        />
      )}

      {/* App modal */}
      {appModal && (
        <AppModal
          app={appModal.app}
          groups={hub.groups}
          onSave={handleSaveApp}
          onDelete={handleDeleteApp}
          onClose={() => setAppModal(null)}
        />
      )}

      {/* Group modal */}
      {groupModal && (
        <GroupModal
          group={groupModal.id ? groupModal : null}
          onSave={handleSaveGroup}
          onDelete={handleDeleteGroup}
          onClose={() => setGroupModal(null)}
        />
      )}

      {/* Manage groups modal */}
      {showManage && (
        <ManageGroupsModal
          groups={hub.groups}
          apps={hub.apps}
          onEdit={(id) => { setShowManage(false); setGroupModal(hub.getGroup(id)) }}
          onNew={() => { setShowManage(false); setGroupModal({}) }}
          onMoveUp={hub.moveGroupUp}
          onMoveDown={hub.moveGroupDown}
          onClose={() => setShowManage(false)}
        />
      )}

      {/* Source modal */}
      {showSourceModal && (
        <SourceModal
          onSave={(src) => { setSources(prev => [...prev, src]); setShowSourceModal(false) }}
          onClose={() => setShowSourceModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 9.2: Build to check for errors**

```bash
cd frontend && npm run build
```

Expected: Build succeeds. No TypeScript/import errors.

- [ ] **Step 9.3: Test in dev server**

```bash
npm run dev
```

Open `http://localhost:5173/dashboard` (after logging in via `/login`). Verify:
- Sidebar shows app icons grouped by color
- News tab loads with skeleton cards then real news
- Apps tab shows dashboard with groups and cards
- Right-click on any app shows context menu
- Click + on sidebar or "+ Add App" opens app modal
- "⊞ Groups" opens manage groups modal

- [ ] **Step 9.4: Commit and push**

```bash
cd ..
git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat: complete dashboard React migration from index.html"
git push origin main
```

---

## Task 10: Production deploy + smoke test

- [ ] **Step 10.1: GitHub Actions deploys automatically — watch at github.com/richardgamarra/clouddesktop/actions**

- [ ] **Step 10.2: If Actions fails or is slow, deploy manually via SSH:**

```bash
ssh -p 2222 root@clouddesktop.infoplay.com
cd /var/www/clouddesktop && git stash || true && git pull origin main
cd frontend && npm install && npm run build
cd ../backend && pm2 restart clouddesktop-api --update-env
```

- [ ] **Step 10.3: Verify at https://clouddesktop.infoplay.com/dashboard:**
- [ ] News tab loads with real RSS cards (5 sources)
- [ ] Apps tab shows Google, Microsoft, Tools groups with all default apps
- [ ] Sidebar icons visible and clickable (opens in new tab)
- [ ] Right-click → context menu appears
- [ ] "+ Add App" → modal opens, can add/save an app
- [ ] "⊞ Groups" → manage groups list opens
- [ ] Ctrl+K → add app modal opens
- [ ] Drag-and-drop reorders cards within a group
- [ ] localStorage data preserved (wsh_groups, wsh_apps keys)

---

## Stage 4 Complete

The full WorkSpace Hub is live as a React app at `/dashboard`. All features from the original index.html are ported:
- News tab with RSS feeds, source management, filter pills
- Apps tab with groups, cards, Open All
- Sidebar with grouped icons and tooltips
- Right-click context menus
- App edit modal with emoji picker + shortcut recorder
- Group CRUD + manage groups
- Drag-to-reorder within groups
- Global keyboard shortcuts
- localStorage persistence (existing user data preserved)

Next: **Stage 5 — Custom tabs** (+ button → Web Page, Bookmarks, Weather, Notes, World Clock, News Feed tabs)

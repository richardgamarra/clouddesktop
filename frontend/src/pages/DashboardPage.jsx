import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import TabEditModal from '../dashboard/TabEditModal'
import DesktopView from '../dashboard/DesktopView'
import { hydrateLocalStorage } from '../lib/crypto'
import { useDesktopApps } from '../dashboard/hooks/useDesktopApps'
import { useOpenWindows } from '../dashboard/hooks/useOpenWindows'
import { useCustomTabs } from '../dashboard/hooks/useCustomTabs'
import { DEFAULT_NEWS_SOURCES } from '../dashboard/constants'
import Sidebar from '../dashboard/Sidebar'
import NewsTab from '../dashboard/NewsTab'
import ContextMenu from '../dashboard/ContextMenu'
import AppModal from '../dashboard/AppModal'
import GroupModal from '../dashboard/GroupModal'
import ManageGroupsModal from '../dashboard/ManageGroupsModal'
import SourceModal from '../dashboard/SourceModal'
import AddTabModal from '../dashboard/AddTabModal'
import WebPageTab from '../dashboard/tabs/WebPageTab'
import BookmarksTab from '../dashboard/tabs/BookmarksTab'
import NotesTab from '../dashboard/tabs/NotesTab'
import WorldClockTab from '../dashboard/tabs/WorldClockTab'
import WeatherTab from '../dashboard/tabs/WeatherTab'
import WidgetsTab from '../dashboard/tabs/WidgetsTab'
import AnnouncementBanner from '../components/AnnouncementBanner'
import UpgradeModal from '../components/UpgradeModal'
import { useSubscription } from '../hooks/useSubscription'
import '../dashboard/dashboard.css'
import { getSettingsJson, loadSettingsJson, collectSettings } from '../lib/crypto'

function loadNewsSources() {
  try { return JSON.parse(localStorage.getItem('wsh_news_sources')) || JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
  catch { return JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
}

const DEFAULT_NEWS_GROUPS = [
  { id: 'ng_general', name: 'General', color: '#5b7fff' },
  { id: 'ng_soccer',  name: 'Soccer',  color: '#3ddcaa' },
]

function loadNewsGroups() {
  try { return JSON.parse(localStorage.getItem('wsh_news_groups') || 'null') || DEFAULT_NEWS_GROUPS }
  catch { return DEFAULT_NEWS_GROUPS }
}

function CustomTabPanel({ tab, onUpdateTab }) {
  if (tab.type === 'webpage')    return <WebPageTab tab={tab} />
  if (tab.type === 'bookmarks')  return <BookmarksTab tab={tab} onUpdateTab={onUpdateTab} />
  if (tab.type === 'notes')      return <NotesTab tab={tab} />
  if (tab.type === 'worldclock') return <WorldClockTab tab={tab} onUpdateTab={onUpdateTab} />
  if (tab.type === 'weather')    return <WeatherTab tab={tab} />
  if (tab.type === 'widgets')    return <WidgetsTab tab={tab} onUpdateTab={onUpdateTab} />
  return null
}

export default function DashboardPage() {
  const { accessToken, user, logout, sync, initSync, syncStatus } = useAuth()
  const navigate = useNavigate()
  const hub = useDesktopApps()
  const { openApp, isOpen } = useOpenWindows()
  const customTabs = useCustomTabs()

  const [defaultTab, setDefaultTabState] = useState(() => localStorage.getItem('wsh_default_tab') || 'news')
  function setDefaultTab(id) { setDefaultTabState(id); localStorage.setItem('wsh_default_tab', id) }

  const [activeTab, setActiveTabRaw] = useState(() => localStorage.getItem('wsh_active_tab') || localStorage.getItem('wsh_default_tab') || 'news')
  function setActiveTab(id) { setActiveTabRaw(id); localStorage.setItem('wsh_active_tab', id) }
  const [sources, setSources] = useState(loadNewsSources)
  const [newsGroups, setNewsGroups] = useState(loadNewsGroups)

  // Background image — reads current theme to pick correct bg
  const getBg = () => {
    const theme = localStorage.getItem('wsh_theme') || 'dark'
    return theme === 'light' ? localStorage.getItem('wsh_bg_light') || '' : localStorage.getItem('wsh_bg_dark') || ''
  }
  const [bgImage, setBgImage] = useState(getBg)
  const bgOpacity = parseFloat(localStorage.getItem('wsh_bg_opacity') || '0.85')

  // Re-read background when storage changes (e.g. theme toggle or settings change)
  useEffect(() => {
    const handler = () => setBgImage(getBg())
    window.addEventListener('storage', handler)
    window.addEventListener('wsh_bg_changed', handler)
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('wsh_bg_changed', handler) }
  }, [])
  const [ctx, setCtx] = useState(null)
  const [appModal, setAppModal] = useState(null)
  const [groupModal, setGroupModal] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [showAddTab, setShowAddTab] = useState(false)
  const [confirmCloseTab, setConfirmCloseTab] = useState(null) // tab id to close
  const [confirmDeleteApp, setConfirmDeleteApp] = useState(null) // app id to delete (right-click path)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { isPro, openBillingPortal } = useSubscription()

  // Show success toast when returning from Stripe checkout
  const [upgradeSuccess, setUpgradeSuccess] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    return p.get('upgrade') === 'success'
  })
  useEffect(() => {
    if (upgradeSuccess) {
      const url = new URL(window.location)
      url.searchParams.delete('upgrade')
      window.history.replaceState({}, '', url)
      setTimeout(() => setUpgradeSuccess(false), 6000)
    }
  }, [])

  const dragTabId = useRef(null)

  useEffect(() => { localStorage.setItem('wsh_news_sources', JSON.stringify(sources)) }, [sources])
  useEffect(() => { localStorage.setItem('wsh_news_groups', JSON.stringify(newsGroups)) }, [newsGroups])

  const [syncEnabled, setSyncEnabled] = useState(false)

  // Tab name/icon overrides for fixed tabs (news/hub) stored in localStorage
  const [tabOverrides, setTabOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wsh_tab_overrides') || '{}') } catch { return {} }
  })
  useEffect(() => { localStorage.setItem('wsh_tab_overrides', JSON.stringify(tabOverrides)) }, [tabOverrides])

  const [editingTab, setEditingTab] = useState(null) // { id, name, icon }

  function openTabEdit(id) {
    const def = getTabDef(id)
    if (!def) return
    const over = tabOverrides[id] || {}
    setEditingTab({ id, name: over.name || def.name, icon: over.icon || def.icon })
  }

  function saveTabEdit({ name, icon }) {
    if (!editingTab) return
    const { id } = editingTab
    const def = getTabDef(id)
    if (!def) return
    if (!def.isCustom) {
      // Fixed tab — save to overrides
      setTabOverrides(prev => ({ ...prev, [id]: { name, icon } }))
    } else {
      // Custom tab — update via hook
      customTabs.updateTab(id, { name, icon })
    }
    setEditingTab(null)
  }

  const [saveStatus, setSaveStatus] = useState('')

  async function handleManualSave() {
    setSaveStatus('⏳ Saving…')
    try {
      await sync(accessToken)
      setSaveStatus('☁ Saved!')
    } catch (err) {
      setSaveStatus('✗ ' + (err?.message?.slice(0, 40) || 'Failed'))
    }
    setTimeout(() => setSaveStatus(''), 4000)
  }

  // Auto-retry sync 30s after an error (keeps retrying until it succeeds)
  useEffect(() => {
    if (syncStatus !== 'error' || !accessToken) return
    const timer = setTimeout(() => sync(accessToken).catch(() => {}), 30000)
    return () => clearTimeout(timer)
  }, [syncStatus, accessToken, sync])

  // ── Cloud sync init: fetch + apply settings once per session ────────────────
  useEffect(() => {
    if (!accessToken) return
    const SYNC_DONE = 'cw_synced'
    if (sessionStorage.getItem(SYNC_DONE)) {
      setSyncEnabled(true)
      return
    }
    if (user?.id) localStorage.setItem('wsh_last_user_id', user.id)
    initSync(accessToken).then(cloudSettings => {
      sessionStorage.setItem(SYNC_DONE, '1')
      if (cloudSettings) {
        window.location.reload()
      } else {
        setSyncEnabled(true)
      }
    }).catch(() => {
      sessionStorage.setItem(SYNC_DONE, '1')
      setSyncEnabled(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-sync to cloud (debounced 2s) — only after initSync completes ───────
  useEffect(() => {
    if (!accessToken || !syncEnabled) return
    const timer = setTimeout(() => sync(accessToken), 2000)
    return () => clearTimeout(timer)
  }, [hub.groups, hub.apps, sources, newsGroups, customTabs.tabs, syncEnabled, accessToken, sync])

  useEffect(() => {
    function handler(e) {
      if (appModal || groupModal || showManage || showAddTab) return
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
  }, [hub.apps, appModal, groupModal, showManage, showAddTab, openApp])

  function handleContextMenu(e, appId) {
    const app = hub.getApp(appId)
    if (!app) return
    setCtx({ x: e.clientX + 4, y: e.clientY + 4, appId, appName: app.name, isOpen: isOpen(appId) })
  }
  function handleCtxMoveToGroup(appId, groupId) { hub.moveApp(appId, groupId); setCtx(null) }
  function handleCtxNewGroup(appId) { setGroupModal({ id: null, _pendingAppId: appId }) }

  function openAddApp(defaultGroupId) {
    setAppModal({ app: { id: null, name: '', url: '', groupId: defaultGroupId || hub.groups[0]?.id || '', emoji: null, favicon: '', shortcut: '' } })
  }
  function openEditApp(appId, focusField) {
    const app = hub.getApp(appId)
    if (app) setAppModal({ app: { ...app }, focusField })
  }
  function handleSaveApp(data) {
    hub.saveApp(data)
    setAppModal(null)
    if (accessToken) sync(accessToken).catch(err => console.error('save app sync failed:', err.message))
  }
  function handleDeleteApp(id) {
    hub.deleteApp(id)
    setAppModal(null)
    if (accessToken) sync(accessToken).catch(err => console.error('delete app sync failed:', err.message))
  }
  function handleExternalAppDrop(groupId, { url, name }) {
    hub.saveApp({ id: null, name, url, groupId, emoji: null, favicon: '', shortcut: '' })
    if (accessToken) sync(accessToken).catch(err => console.error('external drop sync failed:', err.message))
  }

  function handleSaveGroup(data) {
    const pendingAppId = groupModal?._pendingAppId
    hub.saveGroup(data)
    if (pendingAppId && !data.id) hub.moveApp(pendingAppId, data.id || ('g_' + Date.now()))
    setGroupModal(null); setShowManage(false)
    if (accessToken) sync(accessToken).catch(err => console.error('save group sync failed:', err.message))
  }
  function handleDeleteGroup(id) {
    hub.deleteGroup(id); setGroupModal(null); setShowManage(false)
    if (accessToken) sync(accessToken).catch(err => console.error('delete group sync failed:', err.message))
  }

  function handleAddCustomTab(tabData) {
    const id = customTabs.addTab(tabData)
    setActiveTab(id)
  }

  function handleCloseCustomTab(e, id) {
    e.stopPropagation()
    setConfirmCloseTab(id)
  }

  function handleTabDragStart(e, id) { dragTabId.current = id; e.dataTransfer.effectAllowed = 'move' }
  function handleTabDrop(e, targetId) {
    e.preventDefault()
    const sourceId = dragTabId.current
    if (!sourceId || sourceId === targetId) return
    setTabOrder(prev => {
      const si = prev.indexOf(sourceId), ti = prev.indexOf(targetId)
      if (si < 0 || ti < 0) return prev
      const next = [...prev]; next.splice(si, 1); next.splice(ti, 0, sourceId)
      return next
    })
  }

  function moveTab(id, dir) { moveTabOrder(id, dir) }

  function renameTab(id) {
    const tab = customTabs.tabs.find(t => t.id === id)
    if (!tab) return
    const name = prompt('Rename tab:', tab.name)
    if (name && name.trim()) customTabs.updateTab(id, { name: name.trim() })
  }


  // ── Export settings as JSON file ──────────────────────────────────────────────
  function handleExport() {
    const data = getSettingsJson()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'clouddesktop-settings.json'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import settings from JSON file ────────────────────────────────────────────
  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        loadSettingsJson(json)
        if (accessToken) await sync(accessToken)
        window.location.reload()
      } catch {
        alert('Invalid settings file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleLogout() { await logout(accessToken); navigate('/') }

  const activeCustomTab = customTabs.tabs.find(t => t.id === activeTab)

  // ── Unified tab order (includes news + hub + custom) ─────────────────────────
  const FIXED_TABS = [
    { id: 'news', icon: '📰', name: 'News' },
    { id: 'hub',  icon: '⚡', name: 'Apps' },
  ]

  function loadTabOrder(customIds) {
    try {
      const saved = JSON.parse(localStorage.getItem('wsh_tab_order') || 'null')
      if (!Array.isArray(saved)) return null
      // Merge: keep saved order, add any new custom tabs at end, remove deleted ones
      const allIds = ['news', 'hub', ...customIds]
      const filtered = saved.filter(id => allIds.includes(id))
      const missing  = allIds.filter(id => !filtered.includes(id))
      return [...filtered, ...missing]
    } catch { return null }
  }

  const allTabIds = ['news', 'hub', ...customTabs.tabs.map(t => t.id)]
  const [tabOrder, setTabOrder] = useState(() => loadTabOrder(customTabs.tabs.map(t => t.id)) || allTabIds)

  // Keep order in sync when custom tabs change
  useEffect(() => {
    setTabOrder(prev => {
      const allIds = ['news', 'hub', ...customTabs.tabs.map(t => t.id)]
      const filtered = prev.filter(id => allIds.includes(id))
      const missing  = allIds.filter(id => !filtered.includes(id))
      return [...filtered, ...missing]
    })
  }, [customTabs.tabs])

  useEffect(() => {
    localStorage.setItem('wsh_tab_order', JSON.stringify(tabOrder))
  }, [tabOrder])

  function moveTabOrder(id, dir) {
    setTabOrder(prev => {
      const i = prev.indexOf(id), j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next
    })
  }

  function getTabDef(id) {
    const fixed = FIXED_TABS.find(t => t.id === id)
    if (fixed) {
      const over = tabOverrides[id] || {}
      return { ...fixed, name: over.name || fixed.name, icon: over.icon || fixed.icon }
    }
    const custom = customTabs.tabs.find(t => t.id === id)
    return custom ? { id: custom.id, icon: custom.icon, name: custom.name, isCustom: true } : null
  }

  return (
    <div id="dashboard-root" style={bgImage ? {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    } : {}}>
      {bgImage && <div style={{ position:'fixed', inset:0, background:`rgba(0,0,0,${bgOpacity})`, zIndex:-1, pointerEvents:'none' }} />}
      <Sidebar
        groups={hub.groups} apps={hub.apps} openApp={openApp} isOpen={isOpen}
        onAddApp={() => openAddApp()} onContextMenu={handleContextMenu}
        sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      <div id="db-main">
        <AnnouncementBanner />

        {/* TAB BAR — unified reorderable */}
        <div id="tabs-bar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(v => !v)}>☰</button>
          {tabOrder.map((id, idx) => {
            const def = getTabDef(id)
            if (!def) return null
            const isActive = activeTab === id
            const isFirst = idx === 0
            const isLast = idx === tabOrder.length - 1

            if (!def.isCustom) {
              // Fixed tab (News / Apps) — now also movable
              return (
                <button
                  key={id}
                  className={`tab-btn-custom${isActive ? ' active' : ''}`}
                  style={{ fontWeight: 800 }}
                  draggable
                  onDragStart={e => handleTabDragStart(e, id)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleTabDrop(e, id)}
                  onClick={() => setActiveTab(id)}
                  title="Drag to reorder"
                >
                  {!isFirst && <span className="tab-move-btn" onClick={e => { e.stopPropagation(); moveTabOrder(id, -1) }} title="Move left">◀</span>}
                  <span>{def.icon}</span>
                  {def.name}
                  {defaultTab === id && <span style={{ fontSize:9, color:'var(--yellow)', marginLeft:1 }} title="Default login tab">★</span>}
                  {!isLast && <span className="tab-move-btn" onClick={e => { e.stopPropagation(); moveTabOrder(id, 1) }} title="Move right">▶</span>}
                  <span className="tab-move-btn" onClick={e => { e.stopPropagation(); openTabEdit(id) }} title="Edit name & icon">✎</span>
                  <span className="tab-move-btn" onClick={e => { e.stopPropagation(); setDefaultTab(id) }}
                    title={defaultTab === id ? 'Default login tab (click to unset)' : 'Set as default login tab'}
                    style={{ color: defaultTab === id ? 'var(--yellow)' : undefined }}>
                    {defaultTab === id ? '★' : '☆'}
                  </span>
                </button>
              )
            }

            // Custom tab
            return (
              <button
                key={id}
                className={`tab-btn-custom${isActive ? ' active' : ''}`}
                draggable
                onDragStart={e => handleTabDragStart(e, id)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleTabDrop(e, id)}
                onClick={() => setActiveTab(id)}
                title="Drag to reorder"
              >
                {!isFirst && <span className="tab-move-btn" onClick={e => { e.stopPropagation(); moveTabOrder(id, -1) }} title="Move left">◀</span>}
                <span>{def.icon}</span>
                {def.name}
                {defaultTab === id && <span style={{ fontSize:9, color:'var(--yellow)', marginLeft:1 }} title="Default login tab">★</span>}
                {!isLast && <span className="tab-move-btn" onClick={e => { e.stopPropagation(); moveTabOrder(id, 1) }} title="Move right">▶</span>}
                <span className="tab-move-btn" onClick={e => { e.stopPropagation(); openTabEdit(id) }} title="Edit name & icon">✎</span>
                <span className="tab-move-btn" onClick={e => { e.stopPropagation(); setDefaultTab(id) }}
                  title={defaultTab === id ? 'Default login tab (click to unset)' : 'Set as default login tab'}
                  style={{ color: defaultTab === id ? 'var(--yellow)' : undefined }}>
                  {defaultTab === id ? '★' : '☆'}
                </span>
                <button className="tab-close-btn" onClick={e => handleCloseCustomTab(e, id)} title="Close tab">×</button>
              </button>
            )
          })}

          <button className="tab-add-btn" onClick={() => setShowAddTab(true)} title="Add new tab">+</button>
          <div className="tab-spacer" />

          <div className="tab-actions">
            {activeTab === 'news' && (
              <button className="news-add-source-btn" onClick={() => setShowSourceModal(true)}>+ Source</button>
            )}
            {activeTab === 'hub' && (
              <>
                <button className="tb-btn" onClick={() => setGroupModal({})}>+ Group</button>
                <button className="tb-btn" onClick={() => openAddApp()}>+ App</button>
                <button className="open-all-btn" onClick={() => hub.apps.forEach((app, i) => setTimeout(() => openApp(app), i * 100))}>⚡ Open All</button>
              </>
            )}
            <button className="tb-btn" onClick={handleManualSave} disabled={!!saveStatus || syncStatus === 'syncing'} title={syncStatus === 'error' ? 'Sync failed — click to retry' : 'Save workspace to cloud now'}
              style={{ color: saveStatus.startsWith('☁') ? 'var(--green)' : (saveStatus.startsWith('✗') || syncStatus === 'error') ? 'var(--red)' : undefined }}>
              {saveStatus || (syncStatus === 'error' ? '⚠ Retry sync' : syncStatus === 'syncing' ? '⏳ Syncing…' : '💾 Save')}
            </button>
            <button className="tb-btn" onClick={handleExport} title="Export settings as JSON">↓ Export</button>
            <label className="tb-btn" style={{ cursor:'pointer', marginLeft:0 }} title="Import settings from JSON">
              ↑ Import
              <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport} />
            </label>
            {isPro ? (
              <button className="tb-btn" onClick={openBillingPortal} title="Manage subscription" style={{ color: 'var(--accent)' }}>⚡ Pro</button>
            ) : (
              <button className="tb-btn" onClick={() => setShowUpgrade(true)}
                style={{ background: 'var(--accent)', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '4px 10px' }}>
                ⚡ Upgrade
              </button>
            )}
            <button className="tb-btn" onClick={handleLogout} style={{ marginLeft: 4 }}>Log out</button>
          </div>
        </div>

        {/* TAB PANELS */}
        {activeTab === 'news' && (
          <div className="tab-panel">
            <NewsTab sources={sources} onSourcesChange={setSources} newsGroups={newsGroups} onNewsGroupsChange={setNewsGroups} onAddSource={() => setShowSourceModal(true)} />
          </div>
        )}
        {activeTab === 'hub' && (
          <div className="tab-panel">
            <DesktopView
              groups={hub.groups} apps={hub.apps} isOpen={isOpen} openApp={openApp}
              onContextMenu={handleContextMenu} onAddApp={openAddApp} onReorder={hub.reorderApps}
              onExternalDrop={handleExternalAppDrop}
              onEditGroup={(id) => setGroupModal(hub.getGroup(id))}
            />
          </div>
        )}
        {customTabs.tabs.map(t => (
          <div key={t.id} className="tab-panel"
            style={{ display: activeTab === t.id ? 'flex' : 'none' }}>
            <CustomTabPanel tab={t} onUpdateTab={customTabs.updateTab} />
          </div>
        ))}
      </div>

      {ctx && (
        <ContextMenu ctx={ctx} groups={hub.groups} onClose={() => setCtx(null)}
          onOpen={(id) => openApp(hub.getApp(id))} onEdit={openEditApp}
          onDelete={(id) => { setCtx(null); setConfirmDeleteApp(id) }} onMoveToGroup={handleCtxMoveToGroup} onNewGroup={handleCtxNewGroup} />
      )}
      {appModal && (
        <AppModal app={appModal.app} groups={hub.groups} onSave={handleSaveApp}
          onDelete={handleDeleteApp} onClose={() => setAppModal(null)} />
      )}
      {groupModal && (
        <GroupModal group={groupModal.id ? groupModal : null} onSave={handleSaveGroup}
          onDelete={handleDeleteGroup} onClose={() => setGroupModal(null)} />
      )}
      {showManage && (
        <ManageGroupsModal groups={hub.groups} apps={hub.apps}
          onEdit={(id) => { setShowManage(false); setGroupModal(hub.getGroup(id)) }}
          onNew={() => { setShowManage(false); setGroupModal({}) }}
          onMoveUp={hub.moveGroupUp} onMoveDown={hub.moveGroupDown}
          onClose={() => setShowManage(false)} />
      )}
      {showSourceModal && (
        <SourceModal
          onSave={(src) => { setSources(prev => [...prev, src]); setShowSourceModal(false) }}
          onClose={() => setShowSourceModal(false)}
          groups={(() => { try { return JSON.parse(localStorage.getItem('wsh_news_groups') || '[]') } catch { return [] } })()} />
      )}
      {showAddTab && (
        <AddTabModal onAdd={handleAddCustomTab} onClose={() => setShowAddTab(false)} />
      )}

      {confirmCloseTab && (
        <ConfirmModal
          title="Delete Tab"
          message={`Delete "${customTabs.tabs.find(t => t.id === confirmCloseTab)?.name || 'this tab'}"? This cannot be undone — all content in this tab will be permanently removed.`}
          confirmLabel="Delete Tab"
          confirmStyle="danger"
          onConfirm={() => {
            if (activeTab === confirmCloseTab) setActiveTab('news')
            customTabs.removeTab(confirmCloseTab)
            setConfirmCloseTab(null)
          }}
          onCancel={() => setConfirmCloseTab(null)}
        />
      )}

      {confirmDeleteApp && (
        <ConfirmModal
          title="Delete App"
          message={`Delete "${hub.apps.find(a => a.id === confirmDeleteApp)?.name || 'this app'}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmStyle="danger"
          onConfirm={() => { handleDeleteApp(confirmDeleteApp); setConfirmDeleteApp(null) }}
          onCancel={() => setConfirmDeleteApp(null)}
        />
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {upgradeSuccess && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 13, padding: '12px 24px', borderRadius: 10, zIndex: 2000, fontFamily: "'DM Mono',monospace", boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}>
          ✓ Welcome to Pro! Your account has been upgraded.
        </div>
      )}

      {editingTab && (
        <TabEditModal
          tab={editingTab}
          onSave={saveTabEdit}
          onClose={() => setEditingTab(null)}
          isDefault={defaultTab === editingTab.id}
          onSetDefault={setDefaultTab}
        />
      )}

    </div>
  )
}

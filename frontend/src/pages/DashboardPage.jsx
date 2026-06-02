import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordModal from '../components/PasswordModal'
import TabEditModal from '../dashboard/TabEditModal'
import DesktopView from '../dashboard/DesktopView'
import { deriveKey, encryptSettings } from '../lib/crypto'
import { useHubState } from '../dashboard/hooks/useHubState'
import { useOpenWindows } from '../dashboard/hooks/useOpenWindows'
import { useCustomTabs } from '../dashboard/hooks/useCustomTabs'
import { DEFAULT_NEWS_SOURCES } from '../dashboard/constants'
import Sidebar from '../dashboard/Sidebar'
import AppsTab from '../dashboard/AppsTab'
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
import AnnouncementBanner from '../components/AnnouncementBanner'
import '../dashboard/dashboard.css'
import { getSettingsJson, loadSettingsJson } from '../lib/crypto'

function loadNewsSources() {
  try { return JSON.parse(localStorage.getItem('wsh_news_sources')) || JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
  catch { return JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
}

function CustomTabPanel({ tab, onUpdateTab }) {
  if (tab.type === 'webpage')    return <WebPageTab tab={tab} />
  if (tab.type === 'bookmarks')  return <BookmarksTab tab={tab} onUpdateTab={onUpdateTab} />
  if (tab.type === 'notes')      return <NotesTab tab={tab} />
  if (tab.type === 'worldclock') return <WorldClockTab tab={tab} onUpdateTab={onUpdateTab} />
  if (tab.type === 'weather')    return <WeatherTab tab={tab} />
  return null
}

export default function DashboardPage() {
  const { accessToken, logout, sync, syncReady, initSync } = useAuth()
  const navigate = useNavigate()
  const hub = useHubState()
  const { openApp, isOpen } = useOpenWindows()
  const customTabs = useCustomTabs()

  const [activeTab, setActiveTab] = useState('news')
  const [appsView, setAppsView] = useState(() => localStorage.getItem('wsh_apps_view') || 'cards')
  const [sources, setSources] = useState(loadNewsSources)
  const [ctx, setCtx] = useState(null)
  const [appModal, setAppModal] = useState(null)
  const [groupModal, setGroupModal] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [showAddTab, setShowAddTab] = useState(false)

  const dragTabId = useRef(null)

  useEffect(() => { localStorage.setItem('wsh_news_sources', JSON.stringify(sources)) }, [sources])

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

  const [restorePrompt, setRestorePrompt] = useState(false)
  const pendingRestore = useRef(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  async function handleQuickSave(pwd) {
    setShowSaveModal(false)
    if (!user?.id) return
    try {
      const key = await deriveKey(pwd, user.id)
      const blob = await encryptSettings(key)
      await fetch('/api/settings/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(blob),
      })
      setSaveStatus('☁ Saved!')
    } catch {
      setSaveStatus('✗ Failed')
    }
    setTimeout(() => setSaveStatus(''), 3000)
  }

  // ── Cloud sync init: runs once per browser session ───────────────────────────
  useEffect(() => {
    if (!accessToken) return
    const SYNC_DONE = 'cw_synced'
    if (sessionStorage.getItem(SYNC_DONE)) return
    initSync(accessToken).then(hadCloudData => {
      sessionStorage.setItem(SYNC_DONE, '1')
      if (hadCloudData) {
        // Ask user before overwriting local settings
        setRestorePrompt(true)
      }
    }).catch(() => {
      sessionStorage.setItem(SYNC_DONE, '1')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRestoreYes() {
    setRestorePrompt(false)
    window.location.reload()
  }

  function handleRestoreNo() {
    setRestorePrompt(false)
    // User chose to keep current — upload their local settings to cloud
    if (sync && accessToken) sync(accessToken)
  }

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
    setAppModal({ app: { id: '__new__', name: '', url: '', groupId: defaultGroupId || hub.groups[0]?.id || '', emoji: null, favicon: '', shortcut: '' } })
  }
  function openEditApp(appId, focusField) {
    const app = hub.getApp(appId)
    if (app) setAppModal({ app: { ...app }, focusField })
  }
  function handleSaveApp(data) { hub.saveApp(data); setAppModal(null) }
  function handleDeleteApp(id) { hub.deleteApp(id); setAppModal(null) }

  function handleSaveGroup(data) {
    const pendingAppId = groupModal?._pendingAppId
    const newId = data.id || ('g_' + Date.now())
    hub.saveGroup({ ...data, id: newId })
    if (pendingAppId && !data.id) hub.moveApp(pendingAppId, newId)
    setGroupModal(null); setShowManage(false)
  }
  function handleDeleteGroup(id) { hub.deleteGroup(id); setGroupModal(null); setShowManage(false) }

  function handleAddCustomTab(tabData) {
    const id = customTabs.addTab(tabData)
    setActiveTab(id)
  }

  function handleCloseCustomTab(e, id) {
    e.stopPropagation()
    if (activeTab === id) setActiveTab('news')
    customTabs.removeTab(id)
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

  // ── Cloud sync — debounced 2s after any settings change ──────────────────────
  useEffect(() => {
    if (!syncReady) return
    const timer = setTimeout(() => sync(accessToken), 2000)
    return () => clearTimeout(timer)
  }, [hub.groups, hub.apps, sources, customTabs.tabs, syncReady, sync, accessToken])

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
        if (syncReady) await sync(accessToken)
        window.location.reload()
      } catch {
        alert('Invalid settings file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleLogout() { await logout(); navigate('/') }

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
    <div id="dashboard-root">
      <Sidebar
        groups={hub.groups} apps={hub.apps} openApp={openApp} isOpen={isOpen}
        onAddApp={() => openAddApp()} onContextMenu={handleContextMenu}
      />

      <div id="db-main">
        <AnnouncementBanner />

        {/* TAB BAR — unified reorderable */}
        <div id="tabs-bar">
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
                  {!isLast && <span className="tab-move-btn" onClick={e => { e.stopPropagation(); moveTabOrder(id, 1) }} title="Move right">▶</span>}
                  <span className="tab-move-btn" onClick={e => { e.stopPropagation(); openTabEdit(id) }} title="Edit name & icon">✎</span>
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
                {!isLast && <span className="tab-move-btn" onClick={e => { e.stopPropagation(); moveTabOrder(id, 1) }} title="Move right">▶</span>}
                <span className="tab-move-btn" onClick={e => { e.stopPropagation(); openTabEdit(id) }} title="Edit name & icon">✎</span>
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
                <button className="tb-btn" onClick={() => { const v = appsView === 'cards' ? 'desktop' : 'cards'; setAppsView(v); localStorage.setItem('wsh_apps_view', v) }}
                  title={appsView === 'cards' ? 'Switch to Desktop view' : 'Switch to Cards view'}
                  style={{ fontFamily:"'DM Mono',monospace", letterSpacing:'.02em' }}>
                  {appsView === 'cards' ? '🖥 Desktop' : '⊞ Cards'}
                </button>
                {appsView === 'cards' && <button className="tb-btn" onClick={() => setShowManage(true)}>⊞ Groups</button>}
                <button className="tb-btn" onClick={() => openAddApp()}>+ Add App</button>
                <button className="open-all-btn" onClick={() => hub.apps.forEach((app, i) => setTimeout(() => openApp(app), i * 100))}>⚡ Open All</button>
              </>
            )}
            {syncReady && (
              <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--green)', marginRight:4 }} title="Settings synced to cloud">☁ synced</span>
            )}
            <button className="tb-btn" onClick={handleExport} title="Export settings as JSON">↓ Export</button>
            <label className="tb-btn" style={{ cursor:'pointer', marginLeft:0 }} title="Import settings from JSON">
              ↑ Import
              <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport} />
            </label>
            {saveStatus
              ? <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color: saveStatus.startsWith('☁') ? 'var(--green)' : 'var(--red)', marginRight:4 }}>{saveStatus}</span>
              : <button className="tb-btn" onClick={() => setShowSaveModal(true)} title="Save settings to cloud" style={{ marginRight:0 }}>💾 Save</button>
            }
            <button className="tb-btn" onClick={handleLogout} style={{ marginLeft: 4 }}>Log out</button>
          </div>
        </div>

        {/* TAB PANELS */}
        {activeTab === 'news' && (
          <div className="tab-panel">
            <NewsTab sources={sources} onSourcesChange={setSources} onAddSource={() => setShowSourceModal(true)} />
          </div>
        )}
        {activeTab === 'hub' && appsView === 'cards' && (
          <div className="tab-panel">
            <AppsTab
              groups={hub.groups} apps={hub.apps} isOpen={isOpen} openApp={openApp}
              onContextMenu={handleContextMenu} onAddApp={openAddApp}
              onEditGroup={(id) => setGroupModal(hub.getGroup(id))}
              onReorder={hub.reorderApps}
            />
          </div>
        )}
        {activeTab === 'hub' && appsView === 'desktop' && (
          <div className="tab-panel">
            <DesktopView
              groups={hub.groups} apps={hub.apps} isOpen={isOpen} openApp={openApp}
              onContextMenu={handleContextMenu} onAddApp={openAddApp}
            />
          </div>
        )}
        {activeCustomTab && (
          <div className="tab-panel">
            <CustomTabPanel tab={activeCustomTab} onUpdateTab={customTabs.updateTab} />
          </div>
        )}
      </div>

      {ctx && (
        <ContextMenu ctx={ctx} groups={hub.groups} onClose={() => setCtx(null)}
          onOpen={(id) => openApp(hub.getApp(id))} onEdit={openEditApp}
          onDelete={handleDeleteApp} onMoveToGroup={handleCtxMoveToGroup} onNewGroup={handleCtxNewGroup} />
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
          onClose={() => setShowSourceModal(false)} />
      )}
      {showAddTab && (
        <AddTabModal onAdd={handleAddCustomTab} onClose={() => setShowAddTab(false)} />
      )}

      {editingTab && (
        <TabEditModal
          tab={editingTab}
          onSave={saveTabEdit}
          onClose={() => setEditingTab(null)}
        />
      )}

      {showSaveModal && (
        <PasswordModal
          title="💾 Save to Cloud"
          sub="Enter your password to encrypt and save your current workspace to the server."
          onConfirm={handleQuickSave}
          onCancel={() => setShowSaveModal(false)}
        />
      )}

      {/* Restore from cloud prompt */}
      {restorePrompt && (
        <div className="modal-overlay open">
          <div className="modal-box" style={{ width: 440, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☁️</div>
            <div className="modal-title" style={{ textAlign: 'center' }}>Saved workspace found</div>
            <div className="modal-sub" style={{ textAlign: 'center', marginBottom: 24 }}>
              We found your saved settings on the server.<br/>
              Do you want to restore them on this device?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-primary" onClick={handleRestoreYes}>
                ☁ Yes, restore from cloud
              </button>
              <button className="btn-cancel" onClick={handleRestoreNo} style={{ width: '100%' }}>
                Keep current local settings (and save them to cloud)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

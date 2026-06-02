import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  const [sources, setSources] = useState(loadNewsSources)
  const [ctx, setCtx] = useState(null)
  const [appModal, setAppModal] = useState(null)
  const [groupModal, setGroupModal] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [showAddTab, setShowAddTab] = useState(false)

  const dragTabId = useRef(null)

  useEffect(() => { localStorage.setItem('wsh_news_sources', JSON.stringify(sources)) }, [sources])

  // ── Cloud sync init: runs once per browser session ───────────────────────────
  // Uses sessionStorage flag to prevent infinite reload loop
  useEffect(() => {
    if (!accessToken) return
    const SYNC_DONE = 'cw_synced'
    if (sessionStorage.getItem(SYNC_DONE)) return // already synced this tab session
    initSync(accessToken).then(hadCloudData => {
      sessionStorage.setItem(SYNC_DONE, '1') // mark done before any reload
      if (hadCloudData) window.location.reload()
    }).catch(() => {
      sessionStorage.setItem(SYNC_DONE, '1')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    const ids = customTabs.tabs.map(t => t.id)
    const si = ids.indexOf(sourceId), ti = ids.indexOf(targetId)
    if (si < 0 || ti < 0) return
    const newOrder = [...ids]; newOrder.splice(si, 1); newOrder.splice(ti, 0, sourceId)
    customTabs.reorderTabs(newOrder)
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

  return (
    <div id="dashboard-root">
      <Sidebar
        groups={hub.groups} apps={hub.apps} openApp={openApp} isOpen={isOpen}
        onAddApp={() => openAddApp()} onContextMenu={handleContextMenu}
      />

      <div id="db-main">
        <AnnouncementBanner />

        {/* TAB BAR */}
        <div id="tabs-bar">
          <button className={`tab-btn${activeTab === 'news' ? ' active' : ''}`} onClick={() => setActiveTab('news')}>
            <span>📰</span>News
          </button>
          <div className="tab-divider" />
          <button className={`tab-btn${activeTab === 'hub' ? ' active' : ''}`} onClick={() => setActiveTab('hub')}>
            <span>⚡</span>Apps
          </button>
          <div className="tab-divider" />

          {customTabs.tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn-custom${activeTab === tab.id ? ' active' : ''}`}
              draggable
              onDragStart={e => handleTabDragStart(e, tab.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleTabDrop(e, tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.name}
              <button className="tab-close-btn" onClick={e => handleCloseCustomTab(e, tab.id)} title="Close tab">×</button>
            </button>
          ))}

          <button className="tab-add-btn" onClick={() => setShowAddTab(true)} title="Add new tab">+</button>
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
            {syncReady && (
              <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--green)', marginRight:4 }} title="Settings synced to cloud">☁ synced</span>
            )}
            <button className="tb-btn" onClick={handleExport} title="Export settings as JSON">↓ Export</button>
            <label className="tb-btn" style={{ cursor:'pointer', marginLeft:0 }} title="Import settings from JSON">
              ↑ Import
              <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport} />
            </label>
            <button className="tb-btn" onClick={handleLogout} style={{ marginLeft: 8 }}>Log out</button>
          </div>
        </div>

        {/* TAB PANELS */}
        {activeTab === 'news' && (
          <div className="tab-panel">
            <NewsTab sources={sources} onSourcesChange={setSources} onAddSource={() => setShowSourceModal(true)} />
          </div>
        )}
        {activeTab === 'hub' && (
          <div className="tab-panel">
            <AppsTab
              groups={hub.groups} apps={hub.apps} isOpen={isOpen} openApp={openApp}
              onContextMenu={handleContextMenu} onAddApp={openAddApp}
              onEditGroup={(id) => setGroupModal(hub.getGroup(id))}
              onReorder={hub.reorderApps}
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
    </div>
  )
}

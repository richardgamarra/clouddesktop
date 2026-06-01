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
  const [ctx, setCtx] = useState(null)
  const [appModal, setAppModal] = useState(null)
  const [groupModal, setGroupModal] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)

  useEffect(() => { localStorage.setItem('wsh_news_sources', JSON.stringify(sources)) }, [sources])

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

  function handleSaveGroup(data) {
    const pendingAppId = groupModal?._pendingAppId
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
              onReorder={hub.reorderApps}
            />
          </div>
        )}
      </div>

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

      {appModal && (
        <AppModal
          app={appModal.app}
          groups={hub.groups}
          onSave={handleSaveApp}
          onDelete={handleDeleteApp}
          onClose={() => setAppModal(null)}
        />
      )}

      {groupModal && (
        <GroupModal
          group={groupModal.id ? groupModal : null}
          onSave={handleSaveGroup}
          onDelete={handleDeleteGroup}
          onClose={() => setGroupModal(null)}
        />
      )}

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

      {showSourceModal && (
        <SourceModal
          onSave={(src) => { setSources(prev => [...prev, src]); setShowSourceModal(false) }}
          onClose={() => setShowSourceModal(false)}
        />
      )}
    </div>
  )
}

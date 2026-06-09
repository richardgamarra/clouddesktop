import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useHubState } from '../dashboard/hooks/useHubState'
import { useCustomTabs } from '../dashboard/hooks/useCustomTabs'
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
  const customTabs = useCustomTabs()

  // Find the bookmarks tab (type='bookmarks') in the custom tabs system
  const bookmarkTab = customTabs.tabs.find(t => t.type === 'bookmarks')
  const bookmarkItems = bookmarkTab?.config?.items || []

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

  // ── News sources + groups (same keys as desktop) ─────────────────────────
  const [sources, setSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wsh_news_sources')) || DEFAULT_NEWS_SOURCES }
    catch { return DEFAULT_NEWS_SOURCES }
  })
  const [newsGroups, setNewsGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wsh_news_groups') || 'null') || [] }
    catch { return [] }
  })
  useEffect(() => {
    localStorage.setItem('wsh_news_groups', JSON.stringify(newsGroups))
  }, [newsGroups])

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

  // ── Bookmarks helpers — data lives in customTabs (type='bookmarks').config.items
  function saveBookmarkItems(updatedItems) {
    if (!bookmarkTab) return
    customTabs.updateTab(bookmarkTab.id, { config: { ...bookmarkTab.config, items: updatedItems } })
    if (accessToken) sync(accessToken).catch(() => {})
  }
  function handleAddBookmark() {
    const url = window.prompt('Bookmark URL:')
    if (!url) return
    const name = window.prompt('Name:', (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return url } })())
    if (!name) return
    saveBookmarkItems([...bookmarkItems, { id: 'bm_' + Date.now(), url, name, group: '', customIcon: '' }])
  }
  function handleEditBookmark(item) {
    const name = window.prompt('Name:', item.name)
    if (name === null) return
    const url = window.prompt('URL:', item.url)
    if (url === null) return
    saveBookmarkItems(bookmarkItems.map(b => b.id === item.id ? { ...b, name, url } : b))
  }
  function handleDeleteBookmark(id) {
    saveBookmarkItems(bookmarkItems.filter(b => b.id !== id))
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
            items={bookmarkItems}
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
              newsGroups={newsGroups}
              onNewsGroupsChange={setNewsGroups}
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

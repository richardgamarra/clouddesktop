import { useState } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('wsh_theme') || 'dark')
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('wsh_theme', next)
    if (next === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }
  return [theme, toggle]
}

// Read icon overrides (supports both new wsh_apps.emoji and old hub_icon_overrides system)
function getIconOverrides() {
  try { return JSON.parse(localStorage.getItem('hub_icon_overrides') || '{}') } catch { return {} }
}

function AppIcon({ app }) {
  const overrides = getIconOverrides()
  const override = overrides[app.id]
  const emojiValue = override || app.emoji
  if (emojiValue) {
    if (emojiValue.startsWith('http') || emojiValue.startsWith('data:')) {
      return <img src={emojiValue} alt="" style={{ width: 26, height: 26, borderRadius: 5, display: 'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:18px">🌐</span>' }} />
    }
    return <span style={{ fontSize: 22, lineHeight: '26px', display: 'block', textAlign: 'center' }}>{emojiValue}</span>
  }
  const src = app.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(tryHost(app.url))}`
  return <img src={src} alt="" style={{ width: 26, height: 26, borderRadius: 5, display: 'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:18px">🌐</span>' }} />
}

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ groups, apps, openApp, isOpen, onAddApp, onContextMenu, sidebarOpen, onClose }) {
  const [theme, toggleTheme] = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  const sidebarApps = apps.filter(a => a.showInSidebar !== false)
  function appsInGroup(gid) { return sidebarApps.filter(a => a.groupId === gid) }
  function ungrouped() { return sidebarApps.filter(a => !a.groupId || !groups.find(g => g.id === a.groupId)) }

  function handleAppClick(app) { openApp(app); if (onClose) onClose() }

  return (
    <>
    <div className={`sb-drawer-backdrop${sidebarOpen ? ' open' : ''}`} onClick={onClose} />
    <nav id="sb-sidebar" className={sidebarOpen ? 'drawer-open' : ''}>
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
                onClick={() => handleAppClick(app)}
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
              onClick={() => handleAppClick(app)}
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
      {user?.role === 'admin' && (
        <button className="sb-add-btn" title="Admin Panel" onClick={() => navigate('/admin')}
          style={{ fontSize: 16, marginBottom: 4 }}>⚙</button>
      )}
      {user?.role === 'admin' && (
        <button className="sb-add-btn" title="Server Terminal" onClick={() => window.open('/terminal/', '_blank')}
          style={{ fontSize: 16, marginBottom: 4 }}>⌨</button>
      )}
      <button className="sb-add-btn" title="Settings & Backups" onClick={() => navigate('/settings')}
        style={{ fontSize: 16, marginBottom: 4 }}>🗄</button>
      <button className="sb-add-btn" title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'} onClick={toggleTheme}
        style={{ fontSize: 16, marginBottom: 4 }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      <button className="sb-add-btn" title="Add App (Ctrl+K)" onClick={onAddApp}>+</button>
    </nav>
    </>
  )
}

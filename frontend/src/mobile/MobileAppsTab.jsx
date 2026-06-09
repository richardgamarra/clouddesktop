import { useState, useRef } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function getIconOverrides() {
  try { return JSON.parse(localStorage.getItem('hub_icon_overrides') || '{}') } catch { return {} }
}

function AppIcon({ app }) {
  const overrides = getIconOverrides()
  const override = overrides[app.id]
  // override takes highest priority; if present, skip customIcon and use override value below
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
              <span style={{ flex: 1 }}>{group.name}</span>
              <button className="m-group-add-btn" onClick={() => onAddApp(group.id)} title="Add app">＋</button>
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

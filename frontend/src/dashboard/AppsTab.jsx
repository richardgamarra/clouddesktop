import { useRef } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function getIconOverrides() {
  try { return JSON.parse(localStorage.getItem('hub_icon_overrides') || '{}') } catch { return {} }
}

function getBestFavicon(app) {
  const stored = app.favicon || ''
  if (!stored || stored.includes('s2/favicons')) {
    try { return `https://${new URL(app.url).hostname}/favicon.ico` } catch {}
  }
  return stored || `https://${tryHost(app.url)}/favicon.ico`
}

function AppIcon({ app }) {
  const overrides = getIconOverrides()
  const override = overrides[app.id]
  const emojiValue = override || app.emoji
  if (emojiValue) {
    if (emojiValue.startsWith('http') || emojiValue.startsWith('data:')) {
      return <img src={emojiValue} alt="" style={{ width:26, height:26, borderRadius:5, display:'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:18px">🌐</span>' }} />
    }
    return <span style={{ fontSize: 21 }}>{emojiValue}</span>
  }
  const src = getBestFavicon(app)
  return <img src={src} alt="" style={{ width:26, height:26, borderRadius:5, display:'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:18px">🌐</span>' }} />
}

function AppCard({ app, isOpen, onOpen, onContextMenu }) {
  const open = isOpen(app.id)
  return (
    <div
      className={`app-card${open ? ' is-open' : ''}`}
      data-id={app.id}
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
  const dragId = useRef(null)

  function handleDragStart(e, id) {
    dragId.current = id
    e.currentTarget.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging')
    const grid = e.currentTarget.closest('.app-grid')
    if (!grid) return
    const newOrder = [...grid.querySelectorAll('[data-id]')].map(c => c.dataset.id).filter(Boolean)
    onReorder(group.id, newOrder)
    dragId.current = null
  }
  function handleDragOver(e) { e.preventDefault() }
  function handleDrop(e, targetId) {
    e.preventDefault()
    const sourceId = dragId.current
    if (!sourceId || sourceId === targetId) return
    const ids = apps.map(a => a.id)
    const si = ids.indexOf(sourceId), ti = ids.indexOf(targetId)
    if (si < 0 || ti < 0) return
    const newOrder = [...ids]
    newOrder.splice(si, 1); newOrder.splice(ti, 0, sourceId)
    onReorder(group.id, newOrder)
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
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, app.id)}
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

export default function AppsTab({ groups, apps, isOpen, openApp, onContextMenu, onAddApp, onEditGroup, onReorder }) {
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
      {groups.map(g => (
        <GroupSection
          key={g.id}
          group={g}
          apps={appsInGroup(g.id)}
          isOpen={isOpen}
          onOpen={openApp}
          onContextMenu={onContextMenu}
          onAddApp={onAddApp}
          onEditGroup={onEditGroup}
          onReorder={onReorder}
        />
      ))}
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

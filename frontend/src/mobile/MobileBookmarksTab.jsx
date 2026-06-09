import { useState, useRef } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function iconSrc(item) {
  if (item.customIcon) return item.customIcon
  try {
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(item.url).hostname)}`
  } catch { return '' }
}

function SwipeRow({ item, onEdit, onDelete }) {
  const startXRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const REVEAL = 144   // px — total width of Edit + Delete buttons

  function onTouchStart(e) {
    startXRef.current = e.touches[0].clientX
  }
  function onTouchMove(e) {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    if (dx < 0) setOffset(Math.max(dx, -REVEAL))
  }
  function onTouchEnd() {
    startXRef.current = null
    // Snap open if past half, else snap closed
    setOffset(prev => prev < -(REVEAL / 2) ? -REVEAL : 0)
  }

  return (
    <div className="m-bm-row-wrap">
      {/* Action buttons revealed behind the row */}
      <div className="m-bm-actions-bg">
        <button className="m-bm-action-btn edit" onClick={() => { setOffset(0); onEdit(item) }}>
          ✎<br /><span style={{ fontSize: 10 }}>Edit</span>
        </button>
        <button className="m-bm-action-btn delete" onClick={() => { setOffset(0); onDelete(item.id) }}>
          🗑<br /><span style={{ fontSize: 10 }}>Delete</span>
        </button>
      </div>

      {/* The row itself — slides left to reveal buttons */}
      <div
        className="m-bm-row"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (offset !== 0) { setOffset(0); return }
          window.open(item.url, '_blank', 'noopener,noreferrer')
        }}
      >
        <img
          src={iconSrc(item)}
          alt=""
          className="m-bm-favicon"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="m-bm-info">
          <div className="m-bm-name">{item.name}</div>
          <div className="m-bm-domain">{tryHost(item.url)}</div>
        </div>
      </div>
    </div>
  )
}

export default function MobileBookmarksTab({ onAddBookmark, onEditBookmark, onDeleteBookmark }) {
  // Read bookmarks from localStorage (same key BookmarksTab uses)
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wsh_bookmarks') || '[]') } catch { return [] }
  })

  // Keep in sync if the user edits via desktop in another tab (rare but possible)
  function refresh() {
    try { setItems(JSON.parse(localStorage.getItem('wsh_bookmarks') || '[]')) } catch { setItems([]) }
  }

  // Group by folder
  const folders = {}
  items.forEach(item => {
    const key = item.group || '—'
    if (!folders[key]) folders[key] = []
    folders[key].push(item)
  })

  return (
    <div>
      <button className="m-bm-add-btn" onClick={() => { onAddBookmark(); refresh() }}>
        ＋ Add Bookmark
      </button>

      {Object.entries(folders).map(([folder, folderItems]) => (
        <div key={folder}>
          <div className="m-group-header">
            <div className="m-group-dot" style={{ background: 'var(--accent2)' }} />
            {folder}
          </div>
          <div className="m-bm-list">
            {folderItems.map(item => (
              <SwipeRow
                key={item.id}
                item={item}
                onEdit={(bm) => { onEditBookmark(bm); refresh() }}
                onDelete={(id) => {
                  onDeleteBookmark(id)
                  setItems(prev => prev.filter(x => x.id !== id))
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', paddingTop: 40, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
          No bookmarks yet.<br />Tap "Add Bookmark" to get started.
        </div>
      )}
    </div>
  )
}

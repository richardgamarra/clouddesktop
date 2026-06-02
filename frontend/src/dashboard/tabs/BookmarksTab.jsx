import { useState } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function faviconUrl(url) {
  try { return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(new URL(url).hostname)}` }
  catch { return '' }
}

const inputStyle = {
  background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8,
  color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13,
  padding:'8px 10px', outline:'none', width:'100%',
}

function BookmarkCard({ item, onRemove }) {
  return (
    <a className="bookmark-card" href={item.url} target="_blank" rel="noopener noreferrer">
      <img src={faviconUrl(item.url)} alt="" onError={e => { e.target.style.display = 'none' }} />
      <div className="bookmark-card-name">{item.name}</div>
      <div className="bookmark-card-url">{tryHost(item.url)}</div>
      <button className="bookmark-remove" onClick={e => { e.preventDefault(); onRemove(item.id) }}>×</button>
    </a>
  )
}

export default function BookmarksTab({ tab, onUpdateTab }) {
  const items = tab.config.items || []
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName]   = useState('')
  const [newUrl, setNewUrl]     = useState('')
  const [newGroup, setNewGroup] = useState('')

  // Collect unique groups preserving insertion order
  const groups = [...new Set(items.map(i => i.group || '').filter(Boolean))]
  const ungrouped = items.filter(i => !i.group)

  function addItem() {
    if (!newName.trim() || !newUrl.trim()) return
    const updated = [...items, {
      id: 'bm_' + Date.now(),
      name: newName.trim(),
      url: newUrl.trim(),
      group: newGroup.trim() || '',
    }]
    onUpdateTab(tab.id, { config: { ...tab.config, items: updated } })
    setNewName(''); setNewUrl(''); setNewGroup(''); setShowAdd(false)
  }

  function removeItem(id) {
    onUpdateTab(tab.id, { config: { ...tab.config, items: items.filter(i => i.id !== id) } })
  }

  return (
    <div style={{ padding:'28px 32px', overflowY:'auto', flex:1 }}>

      {/* Grouped sections */}
      {groups.map(g => (
        <div key={g} style={{ marginBottom: 28 }}>
          <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:6 }}>
            📁 {g}
          </div>
          <div className="bookmarks-grid" style={{ padding:0 }}>
            {items.filter(i => i.group === g).map(item => (
              <BookmarkCard key={item.id} item={item} onRemove={removeItem} />
            ))}
          </div>
        </div>
      ))}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {groups.length > 0 && (
            <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>
              Other
            </div>
          )}
          <div className="bookmarks-grid" style={{ padding:0 }}>
            {ungrouped.map(item => (
              <BookmarkCard key={item.id} item={item} onRemove={removeItem} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showAdd && (
        <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12, marginBottom:16 }}>
          No bookmarks yet. Click + Add bookmark below to get started.
        </div>
      )}

      {/* Add form */}
      {showAdd ? (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:16, display:'flex', flexDirection:'column', gap:8, maxWidth:380 }}>
          <input style={inputStyle} type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Name (e.g. Gmail)" autoFocus />
          <input style={inputStyle} type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)}
            placeholder="https://…" onKeyDown={e => { if (e.key === 'Enter') addItem() }} />
          <input style={inputStyle} type="text" value={newGroup} onChange={e => setNewGroup(e.target.value)}
            placeholder="Group (optional, e.g. Work)" list="bm-groups-list" />
          <datalist id="bm-groups-list">
            {groups.map(g => <option key={g} value={g} />)}
          </datalist>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn-primary" style={{ fontSize:12, padding:'7px 14px' }} onClick={addItem}>Add</button>
            <button className="btn-cancel" style={{ fontSize:12, padding:'7px 12px' }} onClick={() => { setShowAdd(false); setNewName(''); setNewUrl(''); setNewGroup('') }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="bookmark-add-card" style={{ maxWidth:160 }} onClick={() => setShowAdd(true)}>
          <span style={{ fontSize: 22 }}>+</span>
          <span>Add bookmark</span>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function faviconUrl(url) {
  try { return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(new URL(url).hostname)}` }
  catch { return '' }
}

export default function BookmarksTab({ tab, onUpdateTab }) {
  const items = tab.config.items || []
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl]   = useState('')

  function addItem() {
    if (!newName.trim() || !newUrl.trim()) return
    const updated = [...items, { id: 'bm_' + Date.now(), name: newName.trim(), url: newUrl.trim() }]
    onUpdateTab(tab.id, { config: { ...tab.config, items: updated } })
    setNewName(''); setNewUrl(''); setShowAdd(false)
  }

  function removeItem(id) {
    onUpdateTab(tab.id, { config: { ...tab.config, items: items.filter(i => i.id !== id) } })
  }

  return (
    <div className="bookmarks-grid">
      {items.map(item => (
        <a key={item.id} className="bookmark-card" href={item.url} target="_blank" rel="noopener noreferrer">
          <img src={faviconUrl(item.url)} alt="" onError={e => { e.target.style.display = 'none' }} />
          <div className="bookmark-card-name">{item.name}</div>
          <div className="bookmark-card-url">{tryHost(item.url)}</div>
          <button className="bookmark-remove" onClick={e => { e.preventDefault(); removeItem(item.id) }}>×</button>
        </a>
      ))}
      {showAdd ? (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:14, display:'flex', flexDirection:'column', gap:8 }}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" autoFocus
            style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'8px 10px', outline:'none', width:'100%' }} />
          <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://…"
            style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'8px 10px', outline:'none', width:'100%' }}
            onKeyDown={e => { if (e.key === 'Enter') addItem() }} />
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn-primary" style={{ fontSize:12, padding:'6px 12px' }} onClick={addItem}>Add</button>
            <button className="btn-cancel" style={{ fontSize:12, padding:'6px 10px' }} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="bookmark-add-card" onClick={() => setShowAdd(true)}>
          <span style={{ fontSize: 22 }}>+</span>
          <span>Add bookmark</span>
        </div>
      )}
    </div>
  )
}

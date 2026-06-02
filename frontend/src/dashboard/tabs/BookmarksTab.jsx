import { useState, useRef, useCallback, useEffect } from 'react'

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

// ── Grid view bookmark card ───────────────────────────────────────────────────
function BookmarkCard({ item, onRemove }) {
  return (
    <a className="bookmark-card" href={item.url} target="_blank" rel="noopener noreferrer">
      <img src={faviconUrl(item.url)} alt="" onError={e => { e.target.style.display='none' }} />
      <div className="bookmark-card-name">{item.name}</div>
      <div className="bookmark-card-url">{tryHost(item.url)}</div>
      <button className="bookmark-remove" onClick={e => { e.preventDefault(); onRemove(item.id) }}>×</button>
    </a>
  )
}

// ── Folder view: draggable + resizable panel ──────────────────────────────────
const RESIZE_HANDLES = ['n','s','e','w','nw','ne','sw','se']
const MIN_W = 180, MIN_H = 140

function FolderPanel({ title, items, layout, onLayoutChange, onOpen, onRemove }) {
  const { x=20, y=20, w=260, h=220 } = layout || {}
  const panelRef  = useRef(null)
  const dragRef   = useRef(null)
  const resizeRef = useRef(null)

  // ── Drag ──
  function onDragStart(e) {
    if (e.button !== 0) return
    e.preventDefault()
    const startX = e.clientX - x, startY = e.clientY - y
    function onMove(e) {
      onLayoutChange({ x: e.clientX - startX, y: e.clientY - startY, w, h })
    }
    function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Resize ──
  function onResizeStart(e, dir) {
    if (e.button !== 0) return
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startY = e.clientY
    const startW = w, startH = h, startPx = x, startPy = y
    function onMove(e) {
      const dx = e.clientX - startX, dy = e.clientY - startY
      let nx = startPx, ny = startPy, nw = startW, nh = startH
      if (dir.includes('e')) nw = Math.max(MIN_W, startW + dx)
      if (dir.includes('s')) nh = Math.max(MIN_H, startH + dy)
      if (dir.includes('w')) { nw = Math.max(MIN_W, startW - dx); nx = startPx + (startW - nw) }
      if (dir.includes('n')) { nh = Math.max(MIN_H, startH - dy); ny = startPy + (startH - nh) }
      onLayoutChange({ x: nx, y: ny, w: nw, h: nh })
    }
    function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const cursors = { n:'ns-resize', s:'ns-resize', e:'ew-resize', w:'ew-resize', nw:'nw-resize', ne:'ne-resize', sw:'sw-resize', se:'se-resize' }
  const edgeStyle = (dir) => {
    const s = { position:'absolute', zIndex:10 }
    if (dir === 'n')  return { ...s, top:0, left:8, right:8, height:5, cursor:'ns-resize' }
    if (dir === 's')  return { ...s, bottom:0, left:8, right:8, height:5, cursor:'ns-resize' }
    if (dir === 'e')  return { ...s, right:0, top:8, bottom:8, width:5, cursor:'ew-resize' }
    if (dir === 'w')  return { ...s, left:0, top:8, bottom:8, width:5, cursor:'ew-resize' }
    if (dir === 'nw') return { ...s, top:0, left:0, width:10, height:10, cursor:'nw-resize' }
    if (dir === 'ne') return { ...s, top:0, right:0, width:10, height:10, cursor:'ne-resize' }
    if (dir === 'sw') return { ...s, bottom:0, left:0, width:10, height:10, cursor:'sw-resize' }
    if (dir === 'se') return { ...s, bottom:0, right:0, width:10, height:10, cursor:'se-resize' }
  }

  return (
    <div ref={panelRef} style={{
      position:'absolute', left:x, top:y, width:w, height:h,
      background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:12,
      boxShadow:'0 4px 24px rgba(0,0,0,.35)', display:'flex', flexDirection:'column',
      overflow:'hidden', zIndex:10, userSelect:'none',
    }}>
      {/* Resize handles */}
      {RESIZE_HANDLES.map(d => (
        <div key={d} style={edgeStyle(d)} onMouseDown={e => onResizeStart(e, d)} />
      ))}

      {/* Title bar — drag handle */}
      <div onMouseDown={onDragStart} style={{
        height:34, background:'var(--s3)', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', padding:'0 10px', cursor:'move', flexShrink:0, gap:6,
      }}>
        <span style={{ fontSize:13 }}>📁</span>
        <span style={{ fontSize:12, fontWeight:700, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
        <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{items.length}</span>
      </div>

      {/* Icon grid */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 8px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(64px, 1fr))', gap:4, alignContent:'start' }}>
        {items.map(item => (
          <div key={item.id} style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 4px', borderRadius:8, cursor:'pointer', transition:'background .12s' }}
            onClick={() => onOpen(item.url)}
            onMouseEnter={e => e.currentTarget.style.background='var(--s4)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <img src={faviconUrl(item.url)} alt="" width={24} height={24}
              style={{ borderRadius:5, flexShrink:0 }}
              onError={e => { e.target.outerHTML = '<span style="font-size:22px">🔖</span>' }} />
            <span style={{ fontSize:9, color:'var(--text2)', fontFamily:"'DM Mono',monospace", textAlign:'center', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', width:'100%' }}>
              {item.name}
            </span>
            <button onClick={e => { e.stopPropagation(); onRemove(item.id) }}
              style={{ position:'absolute', top:2, right:2, width:14, height:14, borderRadius:'50%', background:'rgba(255,91,110,.85)', border:'none', color:'#fff', fontSize:9, cursor:'pointer', display:'none', alignItems:'center', justifyContent:'center', lineHeight:1 }}
              className="bm-folder-remove">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main BookmarksTab ─────────────────────────────────────────────────────────
export default function BookmarksTab({ tab, onUpdateTab }) {
  const items   = tab.config.items   || []
  const layout  = tab.config.bmLayout || {}   // { [groupKey]: { x,y,w,h } }
  const bView   = tab.config.bView   || 'grid'

  const [showAdd, setShowAdd]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newUrl, setNewUrl]     = useState('')
  const [newGroup, setNewGroup] = useState('')

  const groups    = [...new Set(items.map(i => i.group || '').filter(Boolean))]
  const ungrouped = items.filter(i => !i.group)
  const allPanels = [...groups.map(g => ({ key:g, title:g, items: items.filter(i => i.group === g) })),
                     ...(ungrouped.length ? [{ key:'__other__', title:'Other', items: ungrouped }] : [])]

  function setView(v) { onUpdateTab(tab.id, { config: { ...tab.config, bView: v } }) }

  function addItem() {
    if (!newName.trim() || !newUrl.trim()) return
    const updated = [...items, { id:'bm_'+Date.now(), name:newName.trim(), url:newUrl.trim(), group:newGroup.trim() || '' }]
    onUpdateTab(tab.id, { config: { ...tab.config, items: updated } })
    setNewName(''); setNewUrl(''); setNewGroup(''); setShowAdd(false)
  }

  function removeItem(id) {
    onUpdateTab(tab.id, { config: { ...tab.config, items: items.filter(i => i.id !== id) } })
  }

  function updatePanelLayout(key, patch) {
    const newLayout = { ...layout, [key]: { ...(layout[key] || {}), ...patch } }
    onUpdateTab(tab.id, { config: { ...tab.config, bmLayout: newLayout } })
  }

  // Auto-position panels that have no saved position
  function getPanelLayout(key, idx) {
    if (layout[key]) return layout[key]
    const col = idx % 3, row = Math.floor(idx / 3)
    return { x: 20 + col * 280, y: 20 + row * 260, w: 260, h: 220 }
  }

  // Show remove button on folder icon hover via CSS
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'bm-folder-hover'
    style.textContent = '.bm-folder-remove { display: flex !important; opacity: 0; transition: opacity .15s; } div:hover > .bm-folder-remove { opacity: 1 !important; }'
    if (!document.getElementById('bm-folder-hover')) document.head.appendChild(style)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid var(--border)', flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--border2)', flexShrink:0 }}>
          {[{ v:'grid', label:'▦', title:'Grid view' }, { v:'folder', label:'🗂', title:'Folder view' }].map(({ v, label, title }) => (
            <button key={v} onClick={() => setView(v)} title={title}
              style={{ padding:'4px 10px', border:'none', cursor:'pointer', fontSize:13, background: bView===v ? 'var(--accent)' : 'var(--s3)', color: bView===v ? '#fff' : 'var(--text3)', transition:'background .15s' }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:7, padding:'5px 13px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          + Add bookmark
        </button>
        {showAdd && (
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <input style={{ ...inputStyle, width:140 }} type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" autoFocus />
            <input style={{ ...inputStyle, width:200 }} type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://…" onKeyDown={e => e.key==='Enter' && addItem()} />
            <input style={{ ...inputStyle, width:120 }} type="text" value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="Group (opt.)" list="bm-groups-list" />
            <datalist id="bm-groups-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
            <button className="btn-primary" style={{ fontSize:12, padding:'6px 12px' }} onClick={addItem}>Add</button>
            <button className="btn-cancel" style={{ fontSize:12, padding:'6px 10px' }} onClick={() => { setShowAdd(false); setNewName(''); setNewUrl(''); setNewGroup('') }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Grid view */}
      {bView === 'grid' && (
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {groups.map(g => (
            <div key={g} style={{ marginBottom:24 }}>
              <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:6 }}>📁 {g}</div>
              <div className="bookmarks-grid" style={{ padding:0 }}>
                {items.filter(i => i.group===g).map(item => <BookmarkCard key={item.id} item={item} onRemove={removeItem} />)}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div style={{ marginBottom:24 }}>
              {groups.length > 0 && <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>Other</div>}
              <div className="bookmarks-grid" style={{ padding:0 }}>
                {ungrouped.map(item => <BookmarkCard key={item.id} item={item} onRemove={removeItem} />)}
              </div>
            </div>
          )}
          {items.length === 0 && <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>No bookmarks yet.</div>}
        </div>
      )}

      {/* Folder view */}
      {bView === 'folder' && (
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          {allPanels.length === 0 && (
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:13, textAlign:'center' }}>
              No bookmarks yet. Click "+ Add bookmark" above.
            </div>
          )}
          {allPanels.map((panel, idx) => (
            <FolderPanel
              key={panel.key}
              title={panel.title}
              items={panel.items}
              layout={getPanelLayout(panel.key, idx)}
              onLayoutChange={patch => updatePanelLayout(panel.key, patch)}
              onOpen={url => window.open(url, '_blank')}
              onRemove={removeItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

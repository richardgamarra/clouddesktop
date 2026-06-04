import { useState, useRef, useEffect } from 'react'
import ConfirmModal from '../../components/ConfirmModal'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function iconSrc(item) {
  if (item.customIcon) return item.customIcon
  try { return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(new URL(item.url).hostname)}` }
  catch { return '' }
}

const iStyle = {
  background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8,
  color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13,
  padding:'8px 10px', outline:'none', width:'100%',
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditBookmarkModal({ item, groups, onSave, onClose }) {
  const [name, setName]             = useState(item.name || '')
  const [url, setUrl]               = useState(item.url || '')
  const [group, setGroup]           = useState(item.group || '')
  const [customIcon, setCustomIcon] = useState(item.customIcon || '')
  const [iconError, setIconError]   = useState(false)

  const preview = customIcon || (url ? (() => { try { return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(new URL(url).hostname)}` } catch { return '' } })() : '')

  function handleSave() {
    if (!name.trim() || !url.trim()) return
    onSave({ ...item, name: name.trim(), url: url.trim(), group: group.trim(), customIcon: customIcon.trim() })
    onClose()
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width:420 }}>
        <div className="modal-title">✎ Edit Bookmark</div>
        <div className="modal-sub">Update name, address, icon or group</div>

        {/* Preview */}
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--s2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
          {preview && !iconError
            ? <img src={preview} alt="" width={28} height={28} style={{ borderRadius:6 }} onError={() => setIconError(true)} />
            : <span style={{ fontSize:24 }}>🔖</span>}
          <div>
            <div style={{ fontSize:13, fontWeight:700 }}>{name || 'Bookmark name'}</div>
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{url ? tryHost(url) : 'url'}</div>
          </div>
        </div>

        <div className="field">
          <label>Name</label>
          <input style={iStyle} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Gmail" autoFocus maxLength={60} />
        </div>
        <div className="field">
          <label>Address (URL)</label>
          <input style={iStyle} type="url" value={url} onChange={e => { setUrl(e.target.value); setIconError(false) }} placeholder="https://…" onKeyDown={e => e.key === 'Enter' && handleSave()} />
        </div>
        <div className="field">
          <label>Custom Icon <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional — paste URL, upload image, or leave blank for auto)</span></label>
          <div style={{ display:'flex', gap:6 }}>
            <input style={{ ...iStyle, flex:1 }} type="url" value={customIcon} onChange={e => { setCustomIcon(e.target.value); setIconError(false) }} placeholder="https://example.com/icon.png" />
            <label title="Upload image" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:8, background:'var(--s3)', border:'1px solid var(--border2)', cursor:'pointer', flexShrink:0, fontSize:16 }}>
              📁
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => { setCustomIcon(ev.target.result); setIconError(false) }
                reader.readAsDataURL(file)
                e.target.value = ''
              }} />
            </label>
          </div>
        </div>
        <div className="field">
          <label>Group <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional)</span></label>
          <input style={iStyle} type="text" value={group} onChange={e => setGroup(e.target.value)} placeholder="Work, Personal…" maxLength={40} list="bm-edit-groups" />
          <datalist id="bm-edit-groups">{groups.map(g => <option key={g} value={g} />)}</datalist>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} onClick={handleSave} disabled={!name.trim() || !url.trim()}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Extract URL from browser drag event ──────────────────────────────────────
function transferTypes(dataTransfer) {
  return Array.from(dataTransfer?.types || [])
}

function isExternalUrlDrag(e) {
  const types = transferTypes(e.dataTransfer)
  return ['text/uri-list', 'text/x-moz-url', 'text/plain', 'text/html'].some(t => types.includes(t))
}

function normalizeDroppedUrl(value) {
  const raw = (value || '').trim()
  if (!raw || raw.startsWith('#')) return null
  if (/^https?:\/\//i.test(raw)) return raw
  if (/^www\./i.test(raw)) return `https://${raw}`
  return null
}

function extractDroppedUrl(e) {
  const uri  = e.dataTransfer.getData('text/uri-list')
  const moz  = e.dataTransfer.getData('text/x-moz-url')
  const text = e.dataTransfer.getData('text/plain')
  const html = e.dataTransfer.getData('text/html')
  const candidates = []

  if (uri) candidates.push(...uri.split(/\r?\n/))
  if (moz) candidates.push(...moz.split(/\r?\n/))
  if (text) candidates.push(...text.split(/\s+/))
  if (html) {
    const href = html.match(/href=["']([^"']+)["']/i)
    if (href) candidates.push(href[1])
  }

  const url = candidates.map(normalizeDroppedUrl).find(Boolean)
  if (!url) return null

  let name = ''
  if (html) {
    const m = html.match(/title="([^"]+)"/) || html.match(/>([^<]{2,60})</)
    if (m) name = m[1].trim()
  }
  if (!name && moz) {
    const lines = moz.split(/\r?\n/).map(x => x.trim()).filter(Boolean)
    if (lines[1] && !normalizeDroppedUrl(lines[1])) name = lines[1]
  }
  if (!name) {
    try { name = new URL(url).hostname.replace('www.', '') } catch { name = url.substring(0, 40) }
  }
  return { url, name: name.substring(0, 60) }
}

// ── Grid view card ────────────────────────────────────────────────────────────
function BookmarkCard({ item, groups, onEdit, onRemove }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <a className="bookmark-card" href={item.url} target="_blank" rel="noopener noreferrer" style={{ position:'relative' }}>
        {item.customIcon
          ? <img src={item.customIcon} alt="" width={24} height={24} style={{ borderRadius:5 }} onError={e => e.target.style.display='none'} />
          : <img src={iconSrc(item)} alt="" onError={e => e.target.style.display='none'} />}
        <div className="bookmark-card-name">{item.name}</div>
        <div className="bookmark-card-url">{tryHost(item.url)}</div>
        {item.group && <div style={{ fontSize:9, color:'var(--accent2)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>📁 {item.group}</div>}
        {/* Edit button */}
        <button className="bookmark-remove" style={{ left:4, right:'auto', background:'rgba(91,127,255,.85)' }}
          onClick={e => { e.preventDefault(); onEdit(item) }}>✎</button>
        {/* Remove button */}
        <button className="bookmark-remove" onClick={e => { e.preventDefault(); setConfirming(true) }}>×</button>
      </a>
      {confirming && (
        <ConfirmModal title="Delete Bookmark" message={`Delete "${item.name}"? This cannot be undone.`}
          confirmLabel="Delete" confirmStyle="danger"
          onConfirm={() => { onRemove(item.id); setConfirming(false) }}
          onCancel={() => setConfirming(false)} />
      )}
    </>
  )
}

// ── Folder view panel ─────────────────────────────────────────────────────────
const RESIZE_HANDLES = ['n','s','e','w','nw','ne','sw','se']
const MIN_W = 180, MIN_H = 140

function FolderPanel({ title, items, groups, layout, onLayoutChange, onOpen, onEdit, onRemove, onReorder, onExternalDrop }) {
  const { x=20, y=20, w=260, h=220 } = layout || {}
  const panelRef  = useRef(null)
  const [confirmId, setConfirmId]       = useState(null)
  const [dragOver, setDragOver]         = useState(null)
  const [extDropOver, setExtDropOver]   = useState(false)  // browser URL dragged over panel

  function handleExtDragOver(e) {
    if (isExternalUrlDrag(e)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setExtDropOver(true)
    }
  }
  function handleExtDrop(e) {
    e.preventDefault()
    setExtDropOver(false)
    const dropped = extractDroppedUrl(e)
    if (dropped && onExternalDrop) onExternalDrop(dropped)
  }
  const dragId = useRef(null)

  function onItemDragStart(e, id) { dragId.current = id; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation() }
  function onItemDragOver(e, id)  { e.preventDefault(); e.stopPropagation(); if (id !== dragId.current) setDragOver(id) }
  function onItemDrop(e, targetId) {
    e.preventDefault(); e.stopPropagation()
    const srcId = dragId.current
    if (!srcId || srcId === targetId) { setDragOver(null); return }
    const arr = [...items]
    const si = arr.findIndex(i => i.id === srcId), ti = arr.findIndex(i => i.id === targetId)
    const [moved] = arr.splice(si, 1); arr.splice(ti, 0, moved)
    onReorder(arr); dragId.current = null; setDragOver(null)
  }
  function onItemDragEnd() { dragId.current = null; setDragOver(null) }

  function onDragStart(e) {
    if (e.button !== 0) return; e.preventDefault()
    const startX = e.clientX - x, startY = e.clientY - y
    const onMove = e => onLayoutChange({ x: e.clientX - startX, y: e.clientY - startY, w, h })
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  function onResizeStart(e, dir) {
    if (e.button !== 0) return; e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startY = e.clientY, startW = w, startH = h, startPx = x, startPy = y
    const onMove = e => {
      const dx = e.clientX - startX, dy = e.clientY - startY
      let nx = startPx, ny = startPy, nw = startW, nh = startH
      if (dir.includes('e')) nw = Math.max(MIN_W, startW + dx)
      if (dir.includes('s')) nh = Math.max(MIN_H, startH + dy)
      if (dir.includes('w')) { nw = Math.max(MIN_W, startW - dx); nx = startPx + (startW - nw) }
      if (dir.includes('n')) { nh = Math.max(MIN_H, startH - dy); ny = startPy + (startH - nh) }
      onLayoutChange({ x: nx, y: ny, w: nw, h: nh })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  const edgeStyle = dir => {
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
    <div ref={panelRef} style={{ position:'absolute', left:x, top:y, width:w, height:h, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,.35)', display:'flex', flexDirection:'column', overflow:'hidden', zIndex:10, userSelect:'none' }}>
      {RESIZE_HANDLES.map(d => <div key={d} style={edgeStyle(d)} onMouseDown={e => onResizeStart(e, d)} />)}

      <div onMouseDown={onDragStart} style={{ height:34, background:'var(--s3)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 10px', cursor:'move', flexShrink:0, gap:6 }}>
        <span style={{ fontSize:13 }}>📁</span>
        <span style={{ fontSize:12, fontWeight:700, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
        <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{items.length}</span>
      </div>

      <div
        onDragOver={handleExtDragOver}
        onDragLeave={() => setExtDropOver(false)}
        onDrop={handleExtDrop}
        style={{ flex:1, overflowY:'auto', padding:'10px 8px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(64px, 1fr))', gap:4, alignContent:'start',
          outline: extDropOver ? '2px dashed var(--accent)' : 'none',
          background: extDropOver ? 'rgba(91,127,255,.07)' : 'transparent',
          borderRadius: extDropOver ? 8 : 0, position:'relative' }}>
        {extDropOver && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', zIndex:5 }}>
            <div style={{ background:'rgba(91,127,255,.9)', color:'#fff', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:700 }}>🔗 Drop to add bookmark</div>
          </div>
        )}
        {items.map(item => (
          <div key={item.id} draggable
            onDragStart={e => onItemDragStart(e, item.id)}
            onDragOver={e => onItemDragOver(e, item.id)}
            onDrop={e => onItemDrop(e, item.id)}
            onDragEnd={onItemDragEnd}
            style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 4px', borderRadius:8, cursor:'grab', transition:'background .12s, box-shadow .12s', background: dragOver === item.id ? 'rgba(91,127,255,.18)' : 'transparent', boxShadow: dragOver === item.id ? '0 0 0 2px var(--accent)' : 'none' }}
            onClick={() => onOpen(item.url)}
            onMouseEnter={e => { if (dragOver !== item.id) e.currentTarget.style.background='var(--s4)' }}
            onMouseLeave={e => { if (dragOver !== item.id) e.currentTarget.style.background='transparent' }}>
            <img src={iconSrc(item)} alt="" width={24} height={24} style={{ borderRadius:5, flexShrink:0 }}
              onError={e => { e.target.outerHTML = '<span style="font-size:20px">🔖</span>' }} />
            <span style={{ fontSize:9, color:'var(--text2)', fontFamily:"'DM Mono',monospace", textAlign:'center', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', width:'100%' }}>
              {item.name}
            </span>
            {/* Edit */}
            <button onClick={e => { e.stopPropagation(); onEdit(item) }}
              style={{ position:'absolute', top:2, left:2, width:14, height:14, borderRadius:'50%', background:'rgba(91,127,255,.85)', border:'none', color:'#fff', fontSize:8, cursor:'pointer', display:'none', alignItems:'center', justifyContent:'center', lineHeight:1 }}
              className="bm-folder-action">✎</button>
            {/* Delete */}
            <button onClick={e => { e.stopPropagation(); setConfirmId(item.id) }}
              style={{ position:'absolute', top:2, right:2, width:14, height:14, borderRadius:'50%', background:'rgba(255,91,110,.85)', border:'none', color:'#fff', fontSize:9, cursor:'pointer', display:'none', alignItems:'center', justifyContent:'center', lineHeight:1 }}
              className="bm-folder-action">×</button>
          </div>
        ))}
      </div>

      {confirmId && (
        <ConfirmModal title="Delete Bookmark" message={`Delete "${items.find(i => i.id === confirmId)?.name || 'this bookmark'}"? This cannot be undone.`}
          confirmLabel="Delete" confirmStyle="danger"
          onConfirm={() => { onRemove(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)} />
      )}
    </div>
  )
}

// ── Main BookmarksTab ─────────────────────────────────────────────────────────
export default function BookmarksTab({ tab, onUpdateTab }) {
  const items  = tab.config.items    || []
  const layout = tab.config.bmLayout || {}
  const bView  = tab.config.bView    || 'grid'

  const [showAdd, setShowAdd]       = useState(false)
  const [newName, setNewName]       = useState('')
  const [newUrl, setNewUrl]         = useState('')
  const [newGroup, setNewGroup]     = useState('')
  const [newCustomIcon, setNewCustomIcon] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const groups    = [...new Set(items.map(i => i.group || '').filter(Boolean))]
  const ungrouped = items.filter(i => !i.group)
  const allPanels = [
    ...groups.map(g => ({ key:g, title:g, items: items.filter(i => i.group === g) })),
    ...(ungrouped.length ? [{ key:'__other__', title:'Other', items: ungrouped }] : [])
  ]

  function setView(v) { onUpdateTab(tab.id, { config: { ...tab.config, bView: v } }) }

  function addItem() {
    if (!newName.trim() || !newUrl.trim()) return
    const updated = [...items, { id:'bm_'+Date.now(), name:newName.trim(), url:newUrl.trim(), group:newGroup.trim() || '', customIcon:newCustomIcon }]
    onUpdateTab(tab.id, { config: { ...tab.config, items: updated } })
    setNewName(''); setNewUrl(''); setNewGroup(''); setNewCustomIcon(''); setShowAdd(false)
  }

  function saveItem(updated) {
    onUpdateTab(tab.id, { config: { ...tab.config, items: items.map(i => i.id === updated.id ? updated : i) } })
  }

  function removeItem(id) {
    onUpdateTab(tab.id, { config: { ...tab.config, items: items.filter(i => i.id !== id) } })
  }

  function addDroppedItem(group, dropped) {
    if (!dropped?.url) return
    const nextGroup = group === '__other__' ? '' : (group || '')
    const exists = items.some(i => i.url === dropped.url && (i.group || '') === nextGroup)
    if (exists) return
    const updated = [
      ...items,
      {
        id: 'bm_' + Date.now(),
        name: dropped.name || tryHost(dropped.url),
        url: dropped.url,
        group: nextGroup,
        customIcon: '',
      },
    ]
    onUpdateTab(tab.id, { config: { ...tab.config, items: updated } })
  }

  function handleGridDragOver(e, group) {
    if (!isExternalUrlDrag(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropTarget(group || '__other__')
  }

  function handleGridDrop(e, group) {
    if (!isExternalUrlDrag(e)) return
    e.preventDefault()
    const dropped = extractDroppedUrl(e)
    addDroppedItem(group, dropped)
    setDropTarget(null)
  }

  function updatePanelLayout(key, patch) {
    const newLayout = { ...layout, [key]: { ...(layout[key] || {}), ...patch } }
    onUpdateTab(tab.id, { config: { ...tab.config, bmLayout: newLayout } })
  }

  function reorderPanel(key, reorderedPanelItems) {
    const otherItems = items.filter(i => (i.group || '') !== (key === '__other__' ? '' : key))
    const updated = key === '__other__' ? [...otherItems, ...reorderedPanelItems] : [...reorderedPanelItems, ...otherItems]
    onUpdateTab(tab.id, { config: { ...tab.config, items: updated } })
  }

  function getPanelLayout(key, idx) {
    if (layout[key]) return layout[key]
    const col = idx % 3, row = Math.floor(idx / 3)
    return { x: 20 + col * 280, y: 20 + row * 260, w: 260, h: 220 }
  }

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'bm-folder-hover'
    style.textContent = '.bm-folder-action { display: flex !important; opacity: 0; transition: opacity .15s; } div:hover > .bm-folder-action { opacity: 1 !important; }'
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
            <input style={{ ...iStyle, width:140 }} type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" autoFocus />
            <input style={{ ...iStyle, width:200 }} type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://…" onKeyDown={e => e.key==='Enter' && addItem()} />
            <input style={{ ...iStyle, width:120 }} type="text" value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="Group (opt.)" list="bm-groups-list" />
            <datalist id="bm-groups-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
            {/* Icon upload */}
            <label title="Upload custom icon" style={{ display:'flex', alignItems:'center', gap:5, height:34, padding:'0 10px', borderRadius:7, background:'var(--s3)', border:'1px solid var(--border2)', cursor:'pointer', fontSize:12, color:'var(--text2)', flexShrink:0 }}>
              {newCustomIcon
                ? <img src={newCustomIcon} alt="" width={20} height={20} style={{ borderRadius:4 }} />
                : <span>🖼 Icon</span>}
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => setNewCustomIcon(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }} />
            </label>
            {newCustomIcon && <button title="Remove icon" style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, padding:'0 2px' }} onClick={() => setNewCustomIcon('')}>×</button>}
            <button className="btn-primary" style={{ fontSize:12, padding:'6px 12px' }} onClick={addItem}>Add</button>
            <button className="btn-cancel" style={{ fontSize:12, padding:'6px 10px' }} onClick={() => { setShowAdd(false); setNewName(''); setNewUrl(''); setNewGroup(''); setNewCustomIcon('') }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Grid view */}
      {bView === 'grid' && (
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {groups.map(g => (
            <div key={g}
              onDragOver={e => handleGridDragOver(e, g)}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null) }}
              onDrop={e => handleGridDrop(e, g)}
              style={{ marginBottom:24, borderRadius:10, outline: dropTarget === g ? '2px dashed var(--accent)' : 'none', background: dropTarget === g ? 'rgba(91,127,255,.07)' : 'transparent', padding: dropTarget === g ? 10 : 0, transition:'background .12s, outline .12s, padding .12s' }}>
              <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:6 }}>📁 {g}</div>
              {dropTarget === g && <div style={{ fontSize:12, color:'var(--accent2)', fontWeight:700, marginBottom:10 }}>🔗 Drop to add bookmark to {g}</div>}
              <div className="bookmarks-grid" style={{ padding:0 }}>
                {items.filter(i => i.group===g).map(item => <BookmarkCard key={item.id} item={item} groups={groups} onEdit={setEditingItem} onRemove={removeItem} />)}
              </div>
            </div>
          ))}
          {(ungrouped.length > 0 || groups.length === 0) && (
            <div
              onDragOver={e => handleGridDragOver(e, '__other__')}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null) }}
              onDrop={e => handleGridDrop(e, '__other__')}
              style={{ marginBottom:24, minHeight: groups.length === 0 && items.length === 0 ? 120 : undefined, borderRadius:10, outline: dropTarget === '__other__' ? '2px dashed var(--accent)' : 'none', background: dropTarget === '__other__' ? 'rgba(91,127,255,.07)' : 'transparent', padding: dropTarget === '__other__' ? 10 : 0, transition:'background .12s, outline .12s, padding .12s' }}>
              {groups.length > 0 && <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>Other</div>}
              {dropTarget === '__other__' && <div style={{ fontSize:12, color:'var(--accent2)', fontWeight:700, marginBottom:10 }}>🔗 Drop to add bookmark</div>}
              <div className="bookmarks-grid" style={{ padding:0 }}>
                {ungrouped.map(item => <BookmarkCard key={item.id} item={item} groups={groups} onEdit={setEditingItem} onRemove={removeItem} />)}
              </div>
              {items.length === 0 && <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>No bookmarks yet. Drop a website here or use + Add bookmark.</div>}
            </div>
          )}
        </div>
      )}

      {/* Folder view */}
      {bView === 'folder' && (
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          {allPanels.length === 0 && (
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:13, textAlign:'center' }}>
              No bookmarks yet.
            </div>
          )}
          {allPanels.map((panel, idx) => (
            <FolderPanel key={panel.key} title={panel.title} items={panel.items} groups={groups}
              layout={getPanelLayout(panel.key, idx)}
              onLayoutChange={patch => updatePanelLayout(panel.key, patch)}
              onOpen={url => window.open(url, '_blank')}
              onEdit={setEditingItem}
              onRemove={removeItem}
              onReorder={reordered => reorderPanel(panel.key, reordered)}
              onExternalDrop={dropped => addDroppedItem(panel.key, dropped)} />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingItem && (
        <EditBookmarkModal item={editingItem} groups={groups}
          onSave={saveItem} onClose={() => setEditingItem(null)} />
      )}
    </div>
  )
}

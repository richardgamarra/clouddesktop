import { useState, useEffect, useRef, useCallback } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

function getIconOverrides() {
  try { return JSON.parse(localStorage.getItem('hub_icon_overrides') || '{}') } catch { return {} }
}

function AppIcon({ app }) {
  const overrides = getIconOverrides()
  const override = overrides[app.id]
  if (!override && app.customIcon) {
    return <img src={app.customIcon} alt={app.name} style={{ width:48, height:48, borderRadius:10, display:'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:36px">🌐</span>' }} />
  }
  const emojiValue = override || app.emoji
  if (emojiValue) {
    if (emojiValue.startsWith('http') || emojiValue.startsWith('data:')) {
      return <img src={emojiValue} alt={app.name} style={{ width:48, height:48, borderRadius:10, display:'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:36px">🌐</span>' }} />
    }
    return <span style={{ fontSize:40, lineHeight:'48px', display:'block', textAlign:'center' }}>{emojiValue}</span>
  }
  const src = app.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(tryHost(app.url))}`
  return <img src={src} alt={app.name} style={{ width:48, height:48, borderRadius:10, display:'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:36px">🌐</span>' }} />
}

const DEFAULT_PANEL_W = 320
const DEFAULT_PANEL_H = 200
const MIN_W = 180
const MIN_H = 120

function GroupPanel({ group, apps, layout, onLayoutChange, openApp, isOpen, onContextMenu, onAddApp, onReorder }) {
  const panelRef   = useRef(null)
  const dragRef    = useRef(null) // panel move/resize
  const iconDragId = useRef(null) // icon reorder
  const [iconDragOver, setIconDragOver] = useState(null)

  const { x = 20, y = 20, width = DEFAULT_PANEL_W, height = DEFAULT_PANEL_H } = layout || {}

  function onIconDragStart(e, id) { iconDragId.current = id; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation() }
  function onIconDragOver(e, id)  { e.preventDefault(); e.stopPropagation(); if (id !== iconDragId.current) setIconDragOver(id) }
  function onIconDrop(e, targetId) {
    e.preventDefault(); e.stopPropagation()
    const srcId = iconDragId.current
    if (!srcId || srcId === targetId) { setIconDragOver(null); return }
    const ids = apps.map(a => a.id)
    const si = ids.indexOf(srcId), ti = ids.indexOf(targetId)
    if (si < 0 || ti < 0) { setIconDragOver(null); return }
    const newOrder = [...ids]; newOrder.splice(si, 1); newOrder.splice(ti, 0, srcId)
    onReorder(group.id, newOrder)
    iconDragId.current = null; setIconDragOver(null)
  }
  function onIconDragEnd() { iconDragId.current = null; setIconDragOver(null) }

  // ── Drag title bar ────────────────────────────────────────────────────────────
  function onTitleMouseDown(e) {
    if (e.target.closest('button')) return
    e.preventDefault()
    dragRef.current = { type: 'move', startX: e.clientX, startY: e.clientY, origX: x, origY: y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // ── Resize from edge/corner ───────────────────────────────────────────────────
  function onResizeMouseDown(e, edge) {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { type: 'resize', edge, startX: e.clientX, startY: e.clientY, origX: x, origY: y, origW: width, origH: height }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current) return
    const { type, startX, startY, origX, origY, origW, origH, edge } = dragRef.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    if (type === 'move') {
      onLayoutChange({ x: Math.max(0, origX + dx), y: Math.max(0, origY + dy), width, height })
    } else if (type === 'resize') {
      let nx = origX, ny = origY, nw = origW, nh = origH
      if (edge.includes('e')) nw = Math.max(MIN_W, origW + dx)
      if (edge.includes('s')) nh = Math.max(MIN_H, origH + dy)
      if (edge.includes('w')) { nw = Math.max(MIN_W, origW - dx); nx = origX + (origW - nw) }
      if (edge.includes('n')) { nh = Math.max(MIN_H, origH - dy); ny = origY + (origH - nh) }
      onLayoutChange({ x: nx, y: ny, width: nw, height: nh })
    }
  }, [width, height, onLayoutChange])

  const onMouseUp = useCallback(() => {
    dragRef.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const resizeHandles = [
    { edge:'e',  style:{ right:-4, top:'20%', width:8, height:'60%', cursor:'ew-resize' } },
    { edge:'s',  style:{ bottom:-4, left:'20%', height:8, width:'60%', cursor:'ns-resize' } },
    { edge:'w',  style:{ left:-4, top:'20%', width:8, height:'60%', cursor:'ew-resize' } },
    { edge:'n',  style:{ top:-4, left:'20%', height:8, width:'60%', cursor:'ns-resize' } },
    { edge:'se', style:{ right:-5, bottom:-5, width:14, height:14, cursor:'se-resize', borderRadius:'0 0 6px 0' } },
    { edge:'sw', style:{ left:-5, bottom:-5, width:14, height:14, cursor:'sw-resize', borderRadius:'0 0 0 6px' } },
    { edge:'ne', style:{ right:-5, top:-5, width:14, height:14, cursor:'ne-resize', borderRadius:'0 6px 0 0' } },
    { edge:'nw', style:{ left:-5, top:-5, width:14, height:14, cursor:'nw-resize', borderRadius:'6px 0 0 0' } },
  ]

  return (
    <div
      ref={panelRef}
      style={{
        position:'absolute', left:x, top:y, width, height,
        background:'rgba(17,20,28,.88)', border:`1px solid ${group.color}44`,
        borderRadius:12, backdropFilter:'blur(12px)',
        boxShadow:`0 8px 32px rgba(0,0,0,.5), 0 0 0 1px ${group.color}22`,
        display:'flex', flexDirection:'column', userSelect:'none',
        zIndex:10,
      }}
    >
      {/* Resize handles */}
      {resizeHandles.map(h => (
        <div key={h.edge}
          style={{ position:'absolute', ...h.style, background:'transparent', zIndex:20 }}
          onMouseDown={e => onResizeMouseDown(e, h.edge)}
        />
      ))}

      {/* Title bar */}
      <div
        onMouseDown={onTitleMouseDown}
        style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:8, cursor:'grab', flexShrink:0, borderBottom:`1px solid ${group.color}33` }}
      >
        <div style={{ width:10, height:10, borderRadius:'50%', background:group.color, flexShrink:0 }} />
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{group.name}</div>
        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{apps.length}</div>
        <button onClick={() => onAddApp(group.id)}
          style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, lineHeight:1, padding:'0 2px' }} title="Add app">+</button>
      </div>

      {/* Icon grid */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 8px', display:'flex', flexWrap:'wrap', alignContent:'flex-start', gap:4, scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent' }}>
        {apps.map(app => (
          <div
            key={app.id}
            draggable
            onDragStart={e => onIconDragStart(e, app.id)}
            onDragOver={e => onIconDragOver(e, app.id)}
            onDrop={e => onIconDrop(e, app.id)}
            onDragEnd={onIconDragEnd}
            onClick={() => openApp(app)}
            onContextMenu={e => { e.preventDefault(); onContextMenu(e, app.id) }}
            title={app.name}
            style={{
              width:72, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              padding:'6px 4px', borderRadius:8, cursor:'grab',
              transition:'background .15s, outline .1s',
              background: iconDragOver === app.id ? 'rgba(91,127,255,.18)' : isOpen(app.id) ? 'rgba(91,127,255,.15)' : 'transparent',
              outline: iconDragOver === app.id ? '2px solid var(--accent)' : isOpen(app.id) ? '1px solid rgba(91,127,255,.4)' : 'none',
            }}
            onMouseEnter={e => { if (!isOpen(app.id) && iconDragOver !== app.id) e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
            onMouseLeave={e => { if (!isOpen(app.id) && iconDragOver !== app.id) e.currentTarget.style.background = 'transparent' }}
          >
            <AppIcon app={app} />
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', textAlign:'center', lineHeight:1.2, wordBreak:'break-word', maxWidth:68, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
              {app.name}
            </div>
          </div>
        ))}
        {apps.length === 0 && (
          <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", padding:8 }}>No apps</div>
        )}
      </div>
    </div>
  )
}

export default function DesktopView({ groups, apps, isOpen, openApp, onContextMenu, onAddApp, onReorder }) {
  const LAYOUT_KEY = 'wsh_desktop_layout'

  function loadLayout() {
    try { return JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}') } catch { return {} }
  }

  function defaultLayout() {
    const layout = {}
    let col = 0, row = 0
    const cols = 3
    const GAP = 24
    const START_X = 20, START_Y = 20
    groups.forEach((g, i) => {
      col = i % cols
      row = Math.floor(i / cols)
      layout[g.id] = {
        x: START_X + col * (DEFAULT_PANEL_W + GAP),
        y: START_Y + row * (DEFAULT_PANEL_H + GAP + 20),
        width: DEFAULT_PANEL_W,
        height: DEFAULT_PANEL_H,
      }
    })
    return layout
  }

  const [layout, setLayout] = useState(() => {
    const saved = loadLayout()
    const def = defaultLayout()
    // merge: use saved if exists, otherwise default
    const merged = { ...def }
    Object.keys(saved).forEach(k => { if (def[k] !== undefined || true) merged[k] = saved[k] })
    return merged
  })

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  }, [layout])

  function updateGroupLayout(gid, patch) {
    setLayout(prev => ({ ...prev, [gid]: { ...(prev[gid] || {}), ...patch } }))
  }

  function resetLayout() {
    const def = defaultLayout()
    setLayout(def)
  }

  function appsInGroup(gid) { return apps.filter(a => a.groupId === gid) }
  const ungrouped = apps.filter(a => !a.groupId || !groups.find(g => g.id === a.groupId))

  // Canvas height = max bottom of any panel + padding
  const canvasH = Math.max(600, ...Object.values(layout).map(l => (l.y || 0) + (l.height || DEFAULT_PANEL_H) + 40))

  return (
    <div style={{ flex:1, overflow:'auto', position:'relative', scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent' }}>
      {/* Reset button */}
      <div style={{ position:'sticky', top:0, zIndex:100, display:'flex', justifyContent:'flex-end', padding:'6px 16px', background:'linear-gradient(var(--bg) 70%, transparent)', pointerEvents:'none' }}>
        <button onClick={resetLayout} style={{ pointerEvents:'all', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text3)', fontSize:10, fontFamily:"'DM Mono',monospace", padding:'4px 10px', cursor:'pointer' }}>
          ↺ Reset layout
        </button>
      </div>

      {/* Free canvas */}
      <div style={{ position:'relative', minHeight: canvasH, minWidth:600 }}>
        {groups.map(g => {
          const ga = appsInGroup(g.id)
          return (
            <GroupPanel
              key={g.id}
              group={g}
              apps={ga}
              layout={layout[g.id]}
              onLayoutChange={patch => updateGroupLayout(g.id, patch)}
              openApp={openApp}
              isOpen={isOpen}
              onContextMenu={onContextMenu}
              onAddApp={onAddApp}
              onReorder={onReorder}
            />
          )
        })}

        {/* Ungrouped floating panel */}
        {ungrouped.length > 0 && (
          <GroupPanel
            group={{ id: '__ungrouped__', name: 'Other', color: '#4e546e' }}
            apps={ungrouped}
            layout={layout['__ungrouped__'] || { x: 20, y: groups.length * (DEFAULT_PANEL_H + 44) + 20, width: DEFAULT_PANEL_W, height: DEFAULT_PANEL_H }}
            onLayoutChange={patch => updateGroupLayout('__ungrouped__', patch)}
            openApp={openApp}
            isOpen={isOpen}
            onContextMenu={onContextMenu}
            onAddApp={() => {}}
            onReorder={onReorder}
          />
        )}
      </div>
    </div>
  )
}

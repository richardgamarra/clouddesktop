import { useState, useRef, useCallback } from 'react'

function formatAge(dateStr) {
  try {
    const d = new Date(dateStr); if (isNaN(d)) return ''
    const m = Math.round((Date.now() - d.getTime()) / 60000)
    if (m < 2) return 'just now'; if (m < 60) return `${m}m ago`
    const h = Math.round(m / 60); if (h < 24) return `${h}h ago`
    return `${Math.round(h / 24)}d ago`
  } catch { return '' }
}

const DEFAULT_PANEL_W = 340
const DEFAULT_PANEL_H = 280
const MIN_W = 280
const MIN_H = 200

function NewsGroupPanel({ group, sources, cache, allGroups, layout, onLayoutChange, onSourceMove }) {
  const panelRef = useRef(null)
  const dragRef  = useRef(null)
  const [moveOpen, setMoveOpen] = useState(null) // source id with open move menu

  const { x = 20, y = 20, width = DEFAULT_PANEL_W, height = DEFAULT_PANEL_H } = layout || {}

  function onTitleMouseDown(e) {
    if (e.target.closest('button') || e.target.closest('select')) return
    e.preventDefault()
    dragRef.current = { type: 'move', startX: e.clientX, startY: e.clientY, origX: x, origY: y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onResizeMouseDown(e, edge) {
    e.preventDefault(); e.stopPropagation()
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

  const otherGroups = allGroups.filter(g => g.id !== group.id)

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
        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{sources.length} src</div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 10px', scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent' }}>
        {sources.length === 0 ? (
          <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", padding:'8px 4px' }}>
            No sources in this group. Assign sources via ✎ Edit.
          </div>
        ) : (
          sources.map(src => {
            const items = cache[src.id]
            return (
              <div key={src.id} style={{ marginBottom:10 }}>
                {/* Source sub-header */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, borderBottom:'1px solid var(--border)', paddingBottom:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, color: src.color, fontFamily:"'DM Mono',monospace", flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{src.name}</span>
                  {otherGroups.length > 0 && (
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <button
                        onClick={() => setMoveOpen(moveOpen === src.id ? null : src.id)}
                        style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:4, color:'var(--text3)', fontSize:9, fontFamily:"'DM Mono',monospace", padding:'2px 5px', cursor:'pointer' }}
                        title="Move to group">
                        ↗ Move
                      </button>
                      {moveOpen === src.id && (
                        <div style={{ position:'absolute', right:0, top:'100%', zIndex:50, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, boxShadow:'0 4px 16px rgba(0,0,0,.4)', minWidth:130, padding:4 }}>
                          <div style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace", padding:'2px 6px 4px' }}>Move to:</div>
                          {otherGroups.map(g => (
                            <div key={g.id}
                              onClick={() => { onSourceMove(src.id, g.id); setMoveOpen(null) }}
                              style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:4, cursor:'pointer', fontSize:11 }}
                              onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                              <span style={{ width:8, height:8, borderRadius:'50%', background:g.color, flexShrink:0, display:'inline-block' }} />
                              {g.name}
                            </div>
                          ))}
                          <div
                            onClick={() => { onSourceMove(src.id, ''); setMoveOpen(null) }}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:4, cursor:'pointer', fontSize:11, borderTop:'1px solid var(--border)', marginTop:2, paddingTop:5 }}
                            onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--border2)', flexShrink:0, display:'inline-block' }} />
                            Ungrouped
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Articles */}
                {!items && (
                  <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", padding:'2px 0 4px' }}>Loading…</div>
                )}
                {items?.error && (
                  <div style={{ fontSize:10, color:'var(--red)', fontFamily:"'DM Mono',monospace", padding:'2px 0 4px' }}>⚠ Fetch failed</div>
                )}
                {Array.isArray(items) && items.map((item, i) => (
                  <a key={item.link + i} href={item.link} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'baseline', gap:6, padding:'3px 0', textDecoration:'none', borderBottom: i < items.length-1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <span style={{ fontSize:9, color:'var(--accent)', flexShrink:0 }}>›</span>
                    <span style={{ fontSize:11, color:'var(--text)', lineHeight:1.4, flex:1, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{item.title}</span>
                    <span style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace", flexShrink:0, whiteSpace:'nowrap' }}>{formatAge(item.pubDate)}</span>
                  </a>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function NewsGroupsView({ sources, cache, newsGroups, groupLayout, onLayoutChange, onSourceMove }) {
  const GAP = 24
  const START_X = 20
  const START_Y = 20
  const COLS = 3

  function defaultPanelLayout(idx) {
    const col = idx % COLS
    const row = Math.floor(idx / COLS)
    return {
      x: START_X + col * (DEFAULT_PANEL_W + GAP),
      y: START_Y + row * (DEFAULT_PANEL_H + GAP + 20),
      width: DEFAULT_PANEL_W,
      height: DEFAULT_PANEL_H,
    }
  }

  // Canvas height
  const allLayouts = newsGroups.map((g, i) => groupLayout[g.id] || defaultPanelLayout(i))
  const canvasH = Math.max(600, ...allLayouts.map(l => (l.y || 0) + (l.height || DEFAULT_PANEL_H) + 40))

  // Ungrouped sources
  const ungroupedSources = sources.filter(s => !s.group || !newsGroups.find(g => g.id === s.group || g.name === s.group))

  return (
    <div style={{ flex:1, overflow:'auto', position:'relative', scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent' }}>
      <div style={{ position:'relative', minHeight: canvasH, minWidth:600 }}>
        {newsGroups.map((group, idx) => {
          const groupSources = sources.filter(s => s.group === group.id || s.group === group.name)
          const layout = groupLayout[group.id] || defaultPanelLayout(idx)
          return (
            <NewsGroupPanel
              key={group.id}
              group={group}
              sources={groupSources}
              cache={cache}
              allGroups={newsGroups}
              layout={layout}
              onLayoutChange={patch => onLayoutChange(group.id, patch)}
              onSourceMove={onSourceMove}
            />
          )
        })}

        {/* Ungrouped panel */}
        {ungroupedSources.length > 0 && (
          <NewsGroupPanel
            group={{ id: '__ungrouped__', name: 'Ungrouped', color: '#4e546e' }}
            sources={ungroupedSources}
            cache={cache}
            allGroups={newsGroups}
            layout={groupLayout['__ungrouped__'] || defaultPanelLayout(newsGroups.length)}
            onLayoutChange={patch => onLayoutChange('__ungrouped__', patch)}
            onSourceMove={onSourceMove}
          />
        )}
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'

export default function TodoWidget({ config, onUpdate }) {
  const items = config.items || []
  const [input, setInput]       = useState('')
  const [editId, setEditId]     = useState(null)
  const [editText, setEditText] = useState('')
  const dragItem                = useRef(null)
  const dragOver                = useRef(null)

  function addItem() {
    if (!input.trim()) return
    onUpdate({ items: [...items, { id: Date.now(), text: input.trim(), done: false }] })
    setInput('')
  }

  function toggle(id) {
    onUpdate({ items: items.map(i => i.id === id ? { ...i, done: !i.done } : i) })
  }

  function remove(id) {
    onUpdate({ items: items.filter(i => i.id !== id) })
  }

  // ── Inline edit ──────────────────────────────────────────────────────────────
  function startEdit(item) {
    setEditId(item.id)
    setEditText(item.text)
  }

  function commitEdit() {
    if (!editText.trim()) { setEditId(null); return }
    onUpdate({ items: items.map(i => i.id === editId ? { ...i, text: editText.trim() } : i) })
    setEditId(null)
  }

  // ── Move up / down ───────────────────────────────────────────────────────────
  function move(id, dir) {
    const idx = items.findIndex(i => i.id === id)
    const next = idx + dir
    if (next < 0 || next >= items.length) return
    const arr = [...items]
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    onUpdate({ items: arr })
  }

  // ── Drag-and-drop reorder ────────────────────────────────────────────────────
  function onDragStart(idx) { dragItem.current = idx }
  function onDragEnter(idx) { dragOver.current = idx }
  function onDragEnd() {
    const from = dragItem.current
    const to   = dragOver.current
    if (from === null || to === null || from === to) { dragItem.current = dragOver.current = null; return }
    const arr = [...items]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    onUpdate({ items: arr })
    dragItem.current = dragOver.current = null
  }

  const btnStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 11, lineHeight: 1, padding: '2px 3px', color: 'var(--text3)'
  }

  return (
    <div>
      {/* Add input */}
      <div style={{ display:'flex', gap:6, marginBottom:10 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add item… (Enter)"
          style={{ flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 10px', outline:'none' }} />
        <button onClick={addItem}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>+</button>
      </div>

      {items.length === 0 && (
        <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>No items yet. Add one above.</div>
      )}

      {items.map((item, idx) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragEnter={() => onDragEnter(idx)}
          onDragEnd={onDragEnd}
          onDragOver={e => e.preventDefault()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 0', borderBottom: '1px solid var(--border)',
            cursor: 'grab', userSelect: 'none'
          }}
        >
          {/* Drag handle */}
          <span style={{ color: 'var(--text3)', fontSize: 12, cursor: 'grab', flexShrink: 0 }} title="Drag to reorder">⠿</span>

          {/* Checkbox */}
          <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)}
            style={{ width:14, height:14, cursor:'pointer', accentColor:'var(--accent)', flexShrink:0 }} />

          {/* Text / edit field */}
          {editId === item.id ? (
            <input
              autoFocus
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditId(null) }}
              style={{ flex:1, background:'var(--s3)', border:'1px solid var(--accent)', borderRadius:4, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'2px 6px', outline:'none' }}
            />
          ) : (
            <span
              onDoubleClick={() => startEdit(item)}
              title="Double-click to edit"
              style={{ flex:1, fontSize:12, fontFamily:"'DM Mono',monospace", textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text3)' : 'var(--text)', cursor: 'text' }}
            >
              {item.text}
            </span>
          )}

          {/* Up / Down / Edit / Delete */}
          <div style={{ display:'flex', alignItems:'center', gap:1, flexShrink:0 }}>
            <button onClick={() => move(item.id, -1)} disabled={idx === 0}
              title="Move up"
              style={{ ...btnStyle, opacity: idx === 0 ? 0.25 : 1 }}
              onMouseEnter={e => { if (idx > 0) e.target.style.color = 'var(--accent)' }}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>▲</button>
            <button onClick={() => move(item.id, 1)} disabled={idx === items.length - 1}
              title="Move down"
              style={{ ...btnStyle, opacity: idx === items.length - 1 ? 0.25 : 1 }}
              onMouseEnter={e => { if (idx < items.length - 1) e.target.style.color = 'var(--accent)' }}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>▼</button>
            <button onClick={() => startEdit(item)}
              title="Edit"
              style={btnStyle}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>✎</button>
            <button onClick={() => remove(item.id)}
              title="Delete"
              style={btnStyle}
              onMouseEnter={e => e.target.style.color = 'var(--red)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>×</button>
          </div>
        </div>
      ))}

      {items.some(i => i.done) && (
        <button onClick={() => onUpdate({ items: items.filter(i => !i.done) })}
          style={{ marginTop:8, background:'none', border:'none', color:'var(--text3)', fontSize:10, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
          Clear done
        </button>
      )}
    </div>
  )
}

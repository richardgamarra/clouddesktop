import { useState } from 'react'

export default function TodoWidget({ config, onUpdate }) {
  const items = config.items || []
  const [input, setInput] = useState('')

  function addItem() {
    if (!input.trim()) return
    const updated = [...items, { id: Date.now(), text: input.trim(), done: false }]
    onUpdate({ items: updated })
    setInput('')
  }

  function toggle(id) {
    onUpdate({ items: items.map(item => item.id === id ? { ...item, done: !item.done } : item) })
  }

  function remove(id) {
    onUpdate({ items: items.filter(item => item.id !== id) })
  }

  return (
    <div>
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
      {items.map(item => (
        <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
          <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)}
            style={{ width:14, height:14, cursor:'pointer', accentColor:'var(--accent)' }} />
          <span style={{ flex:1, fontSize:12, fontFamily:"'DM Mono',monospace", textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text3)' : 'var(--text)' }}>
            {item.text}
          </span>
          <button onClick={() => remove(item.id)}
            style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, lineHeight:1, padding:'2px 4px' }}
            onMouseEnter={e => e.target.style.color = 'var(--red)'}
            onMouseLeave={e => e.target.style.color = 'var(--text3)'}>×</button>
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

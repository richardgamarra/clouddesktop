import { useState } from 'react'
import { CATEGORY_COLORS, RSS_PRESETS } from './constants'

export default function SourceModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('general')

  function handleSave() {
    if (!name.trim() || !url.trim()) return
    onSave({ id: 'src_' + Date.now(), name: name.trim(), url: url.trim(), category, color: CATEGORY_COLORS[category] || '#5b7fff', enabled: true })
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 420 }}>
        <div className="modal-title">Add News Source</div>
        <div className="modal-sub">Paste an RSS feed URL. Fetched via CORS proxy.</div>
        <div className="field"><label>Source Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reuters, Al Jazeera…" maxLength={40} autoFocus /></div>
        <div className="field"><label>RSS Feed URL</label><input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://feeds.example.com/rss" /></div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'9px 12px', cursor:'pointer', appearance:'none' }}>
            {['general','sports','tech','business','science','entertainment'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.07em' }}>Quick presets</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {RSS_PRESETS.map(p => (
              <div key={p.name} onClick={() => { setName(p.name); setUrl(p.url); setCategory(p.category) }}
                style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:20, padding:'4px 12px', fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text2)', cursor:'pointer' }}>
                {p.name}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} onClick={handleSave}>Add Source</button>
        </div>
      </div>
    </div>
  )
}

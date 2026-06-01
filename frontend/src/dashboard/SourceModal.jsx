import { useState } from 'react'
import { CATEGORY_COLORS, RSS_PRESETS } from './constants'

const selectStyle = {
  background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8,
  color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13,
  padding:'9px 12px', cursor:'pointer', appearance:'none', width:'100%',
}

export default function SourceModal({ source, onSave, onClose }) {
  const isEdit = !!source
  const [name, setName]           = useState(source?.name || '')
  const [url, setUrl]             = useState(source?.url || '')
  const [category, setCategory]   = useState(source?.category || 'general')
  const [showImages, setShowImages] = useState(source?.showImages !== false) // default true

  function handleSave() {
    if (!name.trim() || !url.trim()) return
    const color = CATEGORY_COLORS[category] || '#5b7fff'
    if (isEdit) {
      onSave({ ...source, name: name.trim(), url: url.trim(), category, color, showImages })
    } else {
      onSave({ id: 'src_' + Date.now(), name: name.trim(), url: url.trim(), category, color, enabled: true, showImages })
    }
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 420 }}>
        <div className="modal-title">{isEdit ? 'Edit Source' : 'Add News Source'}</div>
        <div className="modal-sub">{isEdit ? 'Update source settings.' : 'Paste an RSS feed URL.'}</div>

        <div className="field">
          <label>Source Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BBC News, Al Jazeera…" maxLength={40} autoFocus />
        </div>
        <div className="field">
          <label>RSS Feed URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://feeds.example.com/rss" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
            {['general','sports','tech','business','science','entertainment'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Show images toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600 }}>Show article images</div>
            <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>
              {showImages ? 'Images visible on cards' : 'Text-only cards'}
            </div>
          </div>
          <button
            onClick={() => setShowImages(v => !v)}
            style={{
              width:42, height:24, borderRadius:12, border:'none', cursor:'pointer',
              background: showImages ? 'var(--accent)' : 'var(--s4)',
              position:'relative', transition:'background .2s', flexShrink:0,
            }}
          >
            <span style={{
              position:'absolute', top:3, left: showImages ? 21 : 3,
              width:18, height:18, borderRadius:'50%', background:'#fff',
              transition:'left .2s', display:'block',
            }} />
          </button>
        </div>

        {!isEdit && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.07em' }}>Quick presets</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {RSS_PRESETS.map(p => (
                <div key={p.name}
                  onClick={() => { setName(p.name); setUrl(p.url); setCategory(p.category) }}
                  style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:20, padding:'4px 12px', fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text2)', cursor:'pointer' }}>
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} onClick={handleSave}>
            {isEdit ? 'Save changes' : 'Add Source'}
          </button>
        </div>
      </div>
    </div>
  )
}

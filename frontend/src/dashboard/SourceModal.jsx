import { useState } from 'react'
import { CATEGORY_COLORS, RSS_PRESETS } from './constants'

const selectStyle = {
  background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8,
  color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13,
  padding:'9px 12px', cursor:'pointer', appearance:'none', width:'100%',
}

const GROUPS = [...new Set(RSS_PRESETS.map(p => p.group))]

export default function SourceModal({ source, onSave, onClose, groups = [] }) {
  const isEdit = !!source
  const [name, setName]             = useState(source?.name || '')
  const [url, setUrl]               = useState(source?.url || '')
  const [category, setCategory]     = useState(source?.category || 'general')
  const [showImages, setShowImages] = useState(source?.showImages !== false)
  const [activeGroup, setActiveGroup] = useState(GROUPS[0])
  // news group assignment
  const [selectedGroup, setSelectedGroup] = useState(source?.group || '')
  const [newGroupName, setNewGroupName]   = useState('')
  const isNewGroup = selectedGroup === '__new__'

  function handleSave() {
    if (!name.trim() || !url.trim()) return
    const color = CATEGORY_COLORS[category] || '#5b7fff'
    const groupVal = isNewGroup ? (newGroupName.trim() || '') : selectedGroup
    if (isEdit) {
      onSave({ ...source, name: name.trim(), url: url.trim(), category, color, showImages, group: groupVal })
    } else {
      onSave({ id: 'src_' + Date.now(), name: name.trim(), url: url.trim(), category, color, enabled: true, showImages, group: groupVal })
    }
  }

  const groupPresets = RSS_PRESETS.filter(p => p.group === activeGroup)

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 520 }}>
        <div className="modal-title">{isEdit ? 'Edit Source' : 'Add News Source'}</div>
        <div className="modal-sub">{isEdit ? 'Update source settings.' : 'Pick a preset or paste any RSS URL.'}</div>

        {/* Quick presets — only on Add */}
        {!isEdit && (
          <div style={{ marginBottom:20 }}>
            {/* Group tabs */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)}
                  style={{ padding:'4px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontFamily:"'DM Mono',monospace", fontWeight:600,
                    background: activeGroup === g ? 'var(--accent)' : 'var(--s3)',
                    color: activeGroup === g ? '#fff' : 'var(--text3)',
                    transition:'all .15s' }}>
                  {g}
                </button>
              ))}
            </div>
            {/* Presets for active group */}
            <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:160, overflowY:'auto', borderRadius:8, border:'1px solid var(--border)', padding:8, background:'var(--s2)' }}>
              {groupPresets.map(p => (
                <div key={p.name} onClick={() => { setName(p.name); setUrl(p.url); setCategory(p.category) }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', borderRadius:6,
                    background: url === p.url ? 'rgba(91,127,255,.12)' : 'transparent',
                    border: url === p.url ? '1px solid var(--accent)' : '1px solid transparent',
                    cursor:'pointer', transition:'all .12s' }}
                  onMouseEnter={e => { if(url !== p.url) e.currentTarget.style.background='var(--s3)' }}
                  onMouseLeave={e => { if(url !== p.url) e.currentTarget.style.background='transparent' }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{p.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label>Source Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BBC News…" maxLength={40} autoFocus={isEdit} />
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
          <button onClick={() => setShowImages(v => !v)}
            style={{ width:42, height:24, borderRadius:12, border:'none', cursor:'pointer', background: showImages ? 'var(--accent)' : 'var(--s4)', position:'relative', transition:'background .2s', flexShrink:0 }}>
            <span style={{ position:'absolute', top:3, left: showImages ? 21 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block' }} />
          </button>
        </div>

        {/* News group selector — only shown when groups are available */}
        {groups.length > 0 && (
          <div className="field">
            <label>News Group</label>
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={selectStyle}>
              <option value="">— No group —</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
              <option value="__new__">+ New group…</option>
            </select>
            {isNewGroup && (
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="New group name…"
                maxLength={40}
                style={{ marginTop:8 }}
              />
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} onClick={handleSave} disabled={!name.trim() || !url.trim()}>
            {isEdit ? 'Save changes' : 'Add Source'}
          </button>
        </div>
      </div>
    </div>
  )
}

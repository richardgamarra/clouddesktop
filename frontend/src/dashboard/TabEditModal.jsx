import { useState } from 'react'
import { EMOJI_LIST } from './constants'

export default function TabEditModal({ tab, onSave, onClose, isDefault, onSetDefault }) {
  const [name, setName] = useState(tab.name || '')
  const [icon, setIcon] = useState(tab.icon || '')
  const [makeDefault, setMakeDefault] = useState(isDefault)

  function handleSave() {
    if (!name.trim()) return
    if (makeDefault && !isDefault) onSetDefault(tab.id)
    else if (!makeDefault && isDefault) onSetDefault('news') // unset — revert to news
    onSave({ name: name.trim(), icon: icon || tab.icon })
    onClose()
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 400 }}>
        <div className="modal-title">✎ Edit Tab</div>
        <div className="modal-sub">Change the tab name and icon</div>

        {/* Preview */}
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--s2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
          <div style={{ fontSize:20 }}>{icon || tab.icon}</div>
          <div style={{ fontSize:14, fontWeight:700 }}>{name || tab.name}</div>
          {makeDefault && <span style={{ marginLeft:'auto', fontSize:10, fontFamily:"'DM Mono',monospace", background:'rgba(245,166,35,.13)', color:'var(--yellow)', borderRadius:20, padding:'2px 8px' }}>★ Default</span>}
        </div>

        <div className="field">
          <label>Tab Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="My Tab" maxLength={24} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }} />
        </div>

        <div className="field">
          <label>Icon (emoji or leave blank for default)</label>
          <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
            placeholder="e.g. 🚀" maxLength={4} />
        </div>

        {/* Default tab toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--s2)', border:`1px solid ${makeDefault ? 'rgba(245,166,35,.4)' : 'var(--border2)'}`, borderRadius:8, padding:'10px 14px', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600 }}>★ Default opening tab</div>
            <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>
              {makeDefault ? 'This tab opens when you log in' : 'Not the default — click to make it the default'}
            </div>
          </div>
          <button type="button" onClick={() => setMakeDefault(v => !v)}
            style={{ width:42, height:24, borderRadius:12, border:'none', cursor:'pointer', background: makeDefault ? 'var(--yellow)' : 'var(--s4)', position:'relative', transition:'background .2s', flexShrink:0 }}>
            <span style={{ position:'absolute', top:3, left: makeDefault ? 21 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block' }} />
          </button>
        </div>

        <div className="emoji-section-title">Quick pick</div>
        <div className="emoji-picker-grid">
          {EMOJI_LIST.map(em => (
            <button key={em} type="button"
              className={`epick-cell${icon === em ? ' sel' : ''}`}
              onClick={() => setIcon(icon === em ? '' : em)}>
              {em}
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

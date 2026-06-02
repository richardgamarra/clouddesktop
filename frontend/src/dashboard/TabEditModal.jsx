import { useState } from 'react'
import { EMOJI_LIST } from './constants'

export default function TabEditModal({ tab, onSave, onClose }) {
  const [name, setName] = useState(tab.name || '')
  const [icon, setIcon] = useState(tab.icon || '')

  function handleSave() {
    if (!name.trim()) return
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

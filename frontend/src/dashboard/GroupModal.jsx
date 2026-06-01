import { useState, useEffect } from 'react'
import { GROUP_COLORS } from './constants'

export default function GroupModal({ group, onSave, onDelete, onClose }) {
  const isNew = !group?.id
  const [name, setName] = useState(group?.name || '')
  const [color, setColor] = useState(group?.color || GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)])

  useEffect(() => { setTimeout(() => document.getElementById('gm-name')?.focus(), 80) }, [])

  function handleSave() {
    if (!name.trim()) {
      const el = document.getElementById('gm-name')
      if (el) { el.style.borderColor = 'var(--red)'; setTimeout(() => el.style.borderColor = '', 900) }
      return
    }
    onSave({ id: group?.id, name: name.trim(), color })
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 400 }}>
        <div className="modal-title">{isNew ? 'New Group' : 'Edit Group'}</div>
        <div className="modal-sub">Groups appear in the dashboard and sidebar.</div>
        <div className="field"><label>Group Name</label><input id="gm-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Work, Personal, Dev…" maxLength={32} /></div>
        <div className="field">
          <label>Color</label>
          <div className="color-row">
            {GROUP_COLORS.map(c => (
              <div key={c} className={`color-dot${color === c ? ' sel' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          {!isNew && <button className="btn-danger" onClick={() => { if (window.confirm('Delete group? Apps become ungrouped.')) onDelete(group.id) }}>Delete Group</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

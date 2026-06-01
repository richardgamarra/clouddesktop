import { useState, useEffect, useRef } from 'react'
import { EMOJI_LIST } from './constants'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function isValidUrl(s) { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }

function renderShortcutText(sc) {
  if (!sc) return <span style={{ color: 'var(--text3)' }}>None</span>
  return sc.split('+').map((k, i, arr) => (
    <span key={i}><span className="shortcut-key">{k}</span>{i < arr.length - 1 ? '+' : ''}</span>
  ))
}

export default function AppModal({ app, groups, onSave, onDelete, onClose }) {
  const isNew = !app?.id || app.id === '__new__'
  const [name, setName]       = useState(app?.name || '')
  const [url, setUrl]         = useState(app?.url || '')
  const [groupId, setGroupId] = useState(app?.groupId || groups[0]?.id || '')
  const [iconVal, setIconVal] = useState(app?.emoji || '')
  const [shortcut, setShortcut] = useState(app?.shortcut || '')
  const [listening, setListening] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    if (app?.focusField === 'icon') document.getElementById('ae-icon-input')?.focus()
    else if (app?.focusField === 'shortcut') setListening(true)
    else setTimeout(() => nameRef.current?.focus(), 80)
  }, [])

  useEffect(() => {
    if (!listening) return
    function handler(e) {
      e.preventDefault(); e.stopPropagation()
      if (e.key === 'Escape') { setListening(false); return }
      if (['Control','Alt','Shift','Meta'].includes(e.key)) return
      const parts = []
      if (e.ctrlKey) parts.push('Ctrl'); if (e.metaKey) parts.push('Cmd')
      if (e.altKey) parts.push('Alt'); if (e.shiftKey) parts.push('Shift')
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      setShortcut(parts.join('+'))
      setListening(false)
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [listening])

  function previewIcon() {
    if (iconVal.startsWith('http')) return <img src={iconVal} style={{ width: 28, height: 28, borderRadius: 6 }} alt="" onError={e => { e.target.outerHTML = '<span>🌐</span>' }} />
    if (iconVal) return <span style={{ fontSize: 24 }}>{iconVal}</span>
    if (url) { try { return <img src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(url).hostname)}`} style={{ width: 28, height: 28, borderRadius: 6 }} alt="" onError={e => { e.target.outerHTML = '<span>🌐</span>' }} /> } catch {} }
    return <span>🌐</span>
  }

  function shake(el) { if (!el) return; el.style.borderColor = 'var(--red)'; setTimeout(() => el.style.borderColor = '', 900) }

  function handleSave() {
    if (!name.trim()) { shake(document.getElementById('ae-name')); return }
    if (!url.trim() || !isValidUrl(url.trim())) { shake(document.getElementById('ae-url')); return }
    let emoji = null, favicon = null
    if (iconVal.startsWith('http')) favicon = iconVal
    else if (iconVal) emoji = iconVal
    else { try { favicon = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(url).hostname)}` } catch {} }
    onSave({ id: app?.id || '__new__', name: name.trim(), url: url.trim(), groupId: groupId || null, emoji, favicon, shortcut })
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-title">{isNew ? 'Add App' : 'Edit App'}</div>
        <div className="modal-sub">{isNew ? 'Fill in the details below.' : 'Changes save when you click Save.'}</div>
        <div className="modal-preview">
          <div className="modal-preview-icon">{previewIcon()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-preview-name">{name || 'App Name'}</div>
            <div className="modal-preview-url">{url || 'https://…'}</div>
            {shortcut && <div className="modal-preview-shortcut">⌨ {shortcut}</div>}
          </div>
        </div>
        <div className="field"><label>App Name</label><input id="ae-name" ref={nameRef} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Gmail, Notion…" maxLength={40} /></div>
        <div className="field"><label>URL</label><input id="ae-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></div>
        <div className="field">
          <label>Group</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'9px 12px', outline:'none', cursor:'pointer', appearance:'none' }}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            <option value="">— No group —</option>
          </select>
        </div>
        <div className="field"><label>Icon — emoji or image URL</label><input id="ae-icon-input" type="text" value={iconVal} onChange={e => setIconVal(e.target.value)} placeholder="🚀 or https://…" maxLength={200} /></div>
        <div className="emoji-section-title">Quick pick</div>
        <div className="emoji-picker-grid">
          {EMOJI_LIST.map(em => (
            <button key={em} type="button" className={`epick-cell${iconVal === em ? ' sel' : ''}`} onClick={() => setIconVal(iconVal === em ? '' : em)}>{em}</button>
          ))}
        </div>
        <div className="field">
          <label>Keyboard Shortcut <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional)</span></label>
          <div className={`shortcut-capture${listening ? ' listening' : ''}`} tabIndex={0} onClick={() => setListening(!listening)}>
            <span>{listening ? 'Press keys…' : renderShortcutText(shortcut)}</span>
            <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{listening ? 'Esc to cancel' : 'click to set'}</span>
          </div>
        </div>
        <div className="modal-actions">
          {!isNew && <button className="btn-danger" onClick={() => { if (window.confirm('Delete this app?')) onDelete(app.id) }}>Delete</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

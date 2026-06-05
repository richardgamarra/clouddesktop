import { useState } from 'react'

export default function PasswordModal({ title, sub, onConfirm, onCancel }) {
  const [pwd, setPwd] = useState('')
  const [show, setShow] = useState(false)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:28, width:380, boxShadow:'0 28px 72px rgba(0,0,0,.7)' }}>
        <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20 }}>{sub}</div>
        <div className="field">
          <label>Your password</label>
          <div style={{ display:'flex', gap:6 }}>
            <input type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)}
              placeholder="••••••••" autoFocus style={{ flex:1 }}
              onKeyDown={e => { if (e.key === 'Enter' && pwd) onConfirm(pwd) }} />
            <button type="button" onClick={() => setShow(v => !v)}
              style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text2)', fontSize:12, padding:'0 10px', cursor:'pointer', flexShrink:0 }}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} disabled={!pwd}
            onClick={() => onConfirm(pwd)}>Continue →</button>
        </div>
      </div>
    </div>
  )
}

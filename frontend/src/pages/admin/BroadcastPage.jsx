import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function BroadcastPage() {
  const { accessToken } = useAuth()
  const [message, setMessage] = useState('')
  const [current, setCurrent] = useState('')
  const [status, setStatus]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/broadcast/active', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.announcement) { setCurrent(d.announcement); setMessage(d.announcement) } })
  }, [accessToken])

  async function publish() {
    setLoading(true); setStatus('')
    const res  = await fetch('/api/admin/broadcast', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` },
      body: JSON.stringify({ message }),
    })
    const data = await res.json()
    setStatus(data.message || data.error)
    if (res.ok) setCurrent(message)
    setLoading(false)
  }

  async function clear() {
    if (!window.confirm('Clear the current announcement?')) return
    setLoading(true); setStatus('')
    const res  = await fetch('/api/admin/broadcast', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` },
      body: JSON.stringify({ message:'' }),
    })
    const data = await res.json()
    setStatus(data.message || data.error)
    if (res.ok) { setCurrent(''); setMessage('') }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth:600 }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:6, letterSpacing:'-.5px' }}>📢 Broadcast</h1>
      <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:28 }}>
        Post a message shown as a banner to all logged-in users on their dashboard.
      </p>
      {current && (
        <div style={{ background:'rgba(91,127,255,.1)', border:'1px solid rgba(91,127,255,.3)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--accent2)', fontFamily:"'DM Mono',monospace" }}>
          <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6, opacity:.7 }}>Current active announcement</div>
          {current}
        </div>
      )}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:6 }}>Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="e.g. We're performing maintenance on Sunday from 2–4 AM UTC."
          rows={4}
          style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'10px 12px', outline:'none', resize:'vertical', lineHeight:1.6 }} />
      </div>
      {status && (
        <div style={{ background:'rgba(61,220,170,.1)', border:'1px solid rgba(61,220,170,.3)', borderRadius:8, padding:'8px 14px', fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--green)', marginBottom:14 }}>
          {status}
        </div>
      )}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={publish} disabled={loading || !message.trim()}
          style={{ background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, padding:'9px 20px', cursor:'pointer', opacity:(!message.trim()||loading)?.5:1 }}>
          {loading ? 'Publishing…' : 'Publish →'}
        </button>
        {current && (
          <button onClick={clear} disabled={loading}
            style={{ background:'transparent', border:'1px solid var(--red)', borderRadius:8, color:'var(--red)', fontSize:13, fontWeight:700, padding:'9px 16px', cursor:'pointer' }}>
            Clear announcement
          </button>
        )}
      </div>
    </div>
  )
}

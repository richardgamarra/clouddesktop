import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AnnouncementBanner() {
  const { accessToken } = useAuth()
  const [message, setMessage]     = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/admin/broadcast/active', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.announcement) setMessage(d.announcement) })
      .catch(() => {})
  }, [accessToken])

  if (!message || dismissed) return null

  return (
    <div style={{
      background:'rgba(91,127,255,.13)', borderBottom:'1px solid rgba(91,127,255,.3)',
      padding:'10px 24px', display:'flex', alignItems:'center', gap:12,
      fontSize:13, color:'var(--accent2)', fontFamily:"'DM Mono',monospace",
    }}>
      <span style={{ fontSize:16 }}>📢</span>
      <span style={{ flex:1 }}>{message}</span>
      <button onClick={() => setDismissed(true)}
        style={{ background:'none', border:'none', color:'var(--text3)', fontSize:18, cursor:'pointer', lineHeight:1, padding:0 }}>
        ×
      </button>
    </div>
  )
}

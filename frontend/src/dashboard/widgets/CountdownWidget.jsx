import { useState, useEffect } from 'react'

function getRemaining(targetDate) {
  const diff = new Date(targetDate) - new Date()
  if (diff <= 0) return { days:0, hours:0, minutes:0, seconds:0, expired:true }
  const s = Math.floor(diff / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    expired: false,
  }
}

export default function CountdownWidget({ config, onUpdate }) {
  const { label, targetDate } = config
  const [remaining, setRemaining] = useState(null)
  const [formLabel, setFormLabel] = useState('')
  const [formDate, setFormDate] = useState('')

  useEffect(() => {
    if (!targetDate) return
    setRemaining(getRemaining(targetDate))
    const t = setInterval(() => setRemaining(getRemaining(targetDate)), 1000)
    return () => clearInterval(t)
  }, [targetDate])

  if (!targetDate || !label) {
    return (
      <div>
        <div style={{ marginBottom:8 }}>
          <input value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="Event name…"
            style={{ width:'100%', background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 10px', outline:'none', boxSizing:'border-box', marginBottom:6 }} />
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
            style={{ width:'100%', background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 10px', outline:'none', boxSizing:'border-box' }} />
        </div>
        <button onClick={() => { if (formLabel && formDate) onUpdate({ label: formLabel, targetDate: formDate }) }}
          disabled={!formLabel || !formDate}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px 16px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          Set
        </button>
      </div>
    )
  }

  if (!remaining) return null

  const unitStyle = { textAlign:'center', minWidth:40 }
  const numStyle  = { fontSize:22, fontWeight:800, fontFamily:"'DM Mono',monospace", color:'var(--accent)', lineHeight:1 }
  const lblStyle  = { fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:700, marginBottom:10, textAlign:'center' }}>{label}</div>
      {remaining.expired ? (
        <div style={{ textAlign:'center', color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Event has passed!</div>
      ) : (
        <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:10 }}>
          <div style={unitStyle}><div style={numStyle}>{remaining.days}</div><div style={lblStyle}>DAYS</div></div>
          <div style={unitStyle}><div style={numStyle}>{String(remaining.hours).padStart(2,'0')}</div><div style={lblStyle}>HRS</div></div>
          <div style={unitStyle}><div style={numStyle}>{String(remaining.minutes).padStart(2,'0')}</div><div style={lblStyle}>MIN</div></div>
          <div style={unitStyle}><div style={numStyle}>{String(remaining.seconds).padStart(2,'0')}</div><div style={lblStyle}>SEC</div></div>
        </div>
      )}
      <div style={{ textAlign:'center' }}>
        <button onClick={() => onUpdate({ label:'', targetDate:'' })}
          style={{ background:'none', border:'none', color:'var(--text3)', fontSize:10, cursor:'pointer', fontFamily:"'DM Mono',monospace' " }}>
          Change event
        </button>
      </div>
    </div>
  )
}

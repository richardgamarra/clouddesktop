import { useState, useEffect } from 'react'

const COMMON = ['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','MXN','BRL','SGD']

export default function CurrencyWidget({ config, onUpdate }) {
  const base = config.base || 'USD'
  const [rates, setRates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState(base)
  const [to, setTo] = useState('EUR')

  useEffect(() => {
    fetch(`https://api.frankfurter.app/latest?from=${base}`)
      .then(r => r.json())
      .then(d => { setRates(d.rates); setLoading(false) })
      .catch(() => setLoading(false))
  }, [base])

  const selectStyle = { background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'5px 8px' }
  const inputStyle  = { background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'5px 8px', width:70, outline:'none' }

  function convert(amt, f, t) {
    if (!rates || !amt) return '—'
    const allRates = { ...rates, [base]: 1 }
    const val = parseFloat(amt) * (allRates[t] / allRates[f])
    return isNaN(val) ? '—' : val.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:4 })
  }

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} min="0" />
        <select value={from} onChange={e => setFrom(e.target.value)} style={selectStyle}>
          {COMMON.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ color:'var(--text3)', fontSize:12 }}>→</span>
        <select value={to} onChange={e => setTo(e.target.value)} style={selectStyle}>
          {COMMON.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:'var(--accent)' }}>
          {convert(amount, from, to)} {to}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
        {COMMON.filter(c => c !== base).slice(0,8).map(c => (
          <div key={c} style={{ display:'flex', justifyContent:'space-between', background:'var(--s3)', borderRadius:6, padding:'3px 8px' }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--text3)' }}>{c}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11 }}>{rates?.[c]?.toFixed(4)}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:6, fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>via Frankfurter.app · base: {base}</div>
    </div>
  )
}

import { useState, useEffect } from 'react'

const ALL_COMMODITIES = [
  // Metals
  { symbol:'GC=F',  name:'Gold',        icon:'🥇', group:'Metals' },
  { symbol:'SI=F',  name:'Silver',      icon:'🥈', group:'Metals' },
  { symbol:'HG=F',  name:'Copper',      icon:'🪙', group:'Metals' },
  { symbol:'PL=F',  name:'Platinum',    icon:'⚪', group:'Metals' },
  { symbol:'PA=F',  name:'Palladium',   icon:'🔩', group:'Metals' },
  // Energy
  { symbol:'CL=F',  name:'Crude Oil (WTI)',   icon:'🛢️', group:'Energy' },
  { symbol:'BZ=F',  name:'Brent Crude',       icon:'🛢️', group:'Energy' },
  { symbol:'NG=F',  name:'Natural Gas',        icon:'⛽', group:'Energy' },
  { symbol:'RB=F',  name:'Gasoline',           icon:'⛽', group:'Energy' },
  // Agriculture
  { symbol:'ZC=F',  name:'Corn',        icon:'🌽', group:'Agriculture' },
  { symbol:'ZW=F',  name:'Wheat',       icon:'🌾', group:'Agriculture' },
  { symbol:'ZS=F',  name:'Soybeans',    icon:'🫘', group:'Agriculture' },
  { symbol:'KC=F',  name:'Coffee',      icon:'☕', group:'Agriculture' },
  { symbol:'SB=F',  name:'Sugar',       icon:'🍬', group:'Agriculture' },
  { symbol:'CC=F',  name:'Cocoa',       icon:'🍫', group:'Agriculture' },
  { symbol:'CT=F',  name:'Cotton',      icon:'🌿', group:'Agriculture' },
]

const DEFAULT_SYMBOLS = ['GC=F','SI=F','CL=F','NG=F','ZC=F']

export default function CommoditiesWidget({ config, onUpdate }) {
  const symbols = config.symbols || DEFAULT_SYMBOLS
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showSettings, setShowSettings] = useState(false)

  function load(syms) {
    setError('')
    fetch(`/api/stocks?symbols=${syms.join(',')}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d.filter(Boolean) : []); setLoading(false) })
      .catch(() => { setError('Failed to load prices.'); setLoading(false) })
  }

  useEffect(() => {
    setLoading(true)
    load(symbols)
    const t = setInterval(() => load(symbols), 60000)
    return () => clearInterval(t)
  }, [symbols.join(',')])

  function toggle(symbol) {
    const next = symbols.includes(symbol)
      ? symbols.filter(s => s !== symbol)
      : [...symbols, symbol]
    if (next.length === 0) return
    onUpdate({ symbols: next })
  }

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>
  if (error)   return <div style={{ color:'var(--red)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{error}</div>

  // Group the commodities metadata for the picker
  const groups = [...new Set(ALL_COMMODITIES.map(c => c.group))]

  return (
    <div>
      {!showSettings ? (
        <>
          {data.map(item => {
            const meta = ALL_COMMODITIES.find(c => c.symbol === item.symbol)
            const pos  = (item.change || 0) >= 0
            return (
              <div key={item.symbol} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>{meta?.icon || '📦'}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700 }}>{meta?.name || item.symbol}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{item.symbol}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>
                    ${item.price?.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                  </div>
                  <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color: pos ? '#4ade80' : 'var(--red)' }}>
                    {pos ? '+' : ''}{item.change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            <div style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>via Yahoo Finance · auto-refreshes</div>
            <button onClick={() => setShowSettings(true)}
              style={{ background:'none', border:'none', color:'var(--text3)', fontSize:11, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
              ⚙ Edit list
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Select commodities to show</div>
          <div style={{ maxHeight:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
            {groups.map(group => (
              <div key={group}>
                <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{group}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  {ALL_COMMODITIES.filter(c => c.group === group).map(c => {
                    const on = symbols.includes(c.symbol)
                    return (
                      <div key={c.symbol} onClick={() => toggle(c.symbol)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', borderRadius:8, background: on ? 'rgba(91,127,255,.1)' : 'var(--s3)', border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, cursor:'pointer' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span>{c.icon}</span>
                          <span style={{ fontSize:12 }}>{c.name}</span>
                          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{c.symbol}</span>
                        </div>
                        <div style={{ width:14, height:14, borderRadius:'50%', background: on ? 'var(--accent)' : 'var(--s4)', border:`2px solid ${on ? 'var(--accent)' : 'var(--border2)'}`, flexShrink:0 }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowSettings(false)}
            style={{ marginTop:10, width:'100%', padding:'7px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--s3)', color:'var(--text)', fontSize:12, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
            ← Done
          </button>
        </>
      )}
    </div>
  )
}

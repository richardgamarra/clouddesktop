import { useState, useEffect } from 'react'

const DEFAULT_SYMBOLS = ['AAPL','TSLA','MSFT','GOOGL','AMZN']

const POPULAR = [
  // Tech
  { symbol:'AAPL', name:'Apple' },
  { symbol:'MSFT', name:'Microsoft' },
  { symbol:'GOOGL', name:'Alphabet' },
  { symbol:'AMZN', name:'Amazon' },
  { symbol:'META', name:'Meta' },
  { symbol:'TSLA', name:'Tesla' },
  { symbol:'NVDA', name:'NVIDIA' },
  { symbol:'AMD', name:'AMD' },
  { symbol:'INTC', name:'Intel' },
  { symbol:'ORCL', name:'Oracle' },
  { symbol:'CRM', name:'Salesforce' },
  { symbol:'NFLX', name:'Netflix' },
  // Finance
  { symbol:'JPM', name:'JPMorgan' },
  { symbol:'BAC', name:'Bank of America' },
  { symbol:'GS', name:'Goldman Sachs' },
  { symbol:'V', name:'Visa' },
  { symbol:'MA', name:'Mastercard' },
  // Other
  { symbol:'DIS', name:'Disney' },
  { symbol:'NKE', name:'Nike' },
  { symbol:'SPOT', name:'Spotify' },
  { symbol:'UBER', name:'Uber' },
  { symbol:'ABNB', name:'Airbnb' },
  // Indices/ETFs
  { symbol:'SPY', name:'S&P 500 ETF' },
  { symbol:'QQQ', name:'Nasdaq ETF' },
  { symbol:'DIA', name:'Dow Jones ETF' },
]

export default function StocksWidget({ config, onUpdate }) {
  const symbols = config.symbols || DEFAULT_SYMBOLS
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [customInput, setCustomInput] = useState('')

  function load(syms) {
    setError('')
    fetch(`/api/stocks?symbols=${syms.join(',')}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d.filter(Boolean) : []); setLoading(false) })
      .catch(() => { setError('Failed to load stocks.'); setLoading(false) })
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

  function addCustom() {
    const sym = customInput.trim().toUpperCase()
    if (!sym || symbols.includes(sym)) { setCustomInput(''); return }
    onUpdate({ symbols: [...symbols, sym] })
    setCustomInput('')
  }

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>
  if (error) return <div style={{ color:'var(--red)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{error}</div>

  return (
    <div>
      {!showSettings ? (
        <>
          {data.map(stock => {
            const pos = (stock.change || 0) >= 0
            return (
              <div key={stock.symbol} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{stock.symbol}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{stock.name}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>${stock.price?.toFixed(2)}</div>
                  <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color: pos ? '#4ade80' : 'var(--red)' }}>
                    {pos ? '+' : ''}{stock.change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            <div style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>via Yahoo Finance · auto-refreshes</div>
            <button onClick={() => setShowSettings(true)}
              style={{ background:'none', border:'none', color:'var(--text3)', fontSize:11, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
              ⚙ Edit stocks
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>Select stocks to show</div>

          {/* Custom symbol input */}
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            <input
              type="text" value={customInput} onChange={e => setCustomInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') addCustom() }}
              placeholder="Add ticker (e.g. COIN)"
              maxLength={6}
              style={{ flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 10px', outline:'none' }}
            />
            <button onClick={addCustom}
              style={{ padding:'6px 12px', borderRadius:7, border:'none', background:'var(--accent)', color:'#fff', fontSize:12, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
              Add
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:220, overflowY:'auto' }}>
            {/* Show all popular + any custom symbols not in the popular list */}
            {[...POPULAR, ...symbols.filter(s => !POPULAR.find(p => p.symbol === s)).map(s => ({ symbol:s, name:'Custom' }))].map(s => {
              const on = symbols.includes(s.symbol)
              return (
                <div key={s.symbol} onClick={() => toggle(s.symbol)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', borderRadius:8, background: on ? 'rgba(91,127,255,.1)' : 'var(--s3)', border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, cursor:'pointer' }}>
                  <div>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{s.symbol}</span>
                    <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginLeft:8 }}>{s.name}</span>
                  </div>
                  <div style={{ width:14, height:14, borderRadius:'50%', background: on ? 'var(--accent)' : 'var(--s4)', border:`2px solid ${on ? 'var(--accent)' : 'var(--border2)'}`, flexShrink:0 }} />
                </div>
              )
            })}
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

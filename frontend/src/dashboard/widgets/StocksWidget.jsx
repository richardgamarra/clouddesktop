import { useState, useEffect } from 'react'

const DEFAULT_SYMBOLS = ['AAPL','TSLA','MSFT','GOOGL','AMZN']

export default function StocksWidget({ config, onUpdate }) {
  const symbols = config.symbols || DEFAULT_SYMBOLS
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setError('')
    fetch(`/api/stocks?symbols=${symbols.join(',')}`)
      .then(r => r.json())
      .then(d => { setData(d.filter(Boolean)); setLoading(false) })
      .catch(() => { setError('Failed to load stocks.'); setLoading(false) })
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [symbols.join(',')])

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>
  if (error) return <div style={{ color:'var(--red)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{error}</div>

  return (
    <div>
      {data.map(stock => {
        const pos = (stock.change || 0) >= 0
        return (
          <div key={stock.symbol} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{stock.symbol}</div>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{stock.name}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>
                ${stock.price?.toFixed(2)}
              </div>
              <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color: pos ? 'var(--green, #4ade80)' : 'var(--red)' }}>
                {pos ? '+' : ''}{stock.change?.toFixed(2)}%
              </div>
            </div>
          </div>
        )
      })}
      <div style={{ marginTop:6, fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>via Yahoo Finance · auto-refreshes</div>
    </div>
  )
}

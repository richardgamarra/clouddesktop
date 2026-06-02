import { useState, useEffect } from 'react'

const DEFAULT_COINS = ['bitcoin','ethereum','solana','cardano','dogecoin']

export default function CryptoWidget({ config, onUpdate }) {
  const coins = config.coins || DEFAULT_COINS
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setError('')
    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coins.join(',')}&order=market_cap_desc`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load prices.'); setLoading(false) })
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [coins.join(',')])

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>
  if (error) return <div style={{ color:'var(--red)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{error}</div>

  return (
    <div>
      {data.map(coin => {
        const pos = coin.price_change_percentage_24h >= 0
        return (
          <div key={coin.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <img src={coin.image} alt={coin.symbol} style={{ width:20, height:20, borderRadius:'50%' }} />
              <div>
                <div style={{ fontSize:12, fontWeight:700 }}>{coin.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", textTransform:'uppercase' }}>{coin.symbol}</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>
                ${coin.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color: pos ? 'var(--green, #4ade80)' : 'var(--red)' }}>
                {pos ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
              </div>
            </div>
          </div>
        )
      })}
      <div style={{ marginTop:6, fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>via CoinGecko · auto-refreshes</div>
    </div>
  )
}

import { useState, useEffect } from 'react'

const DEFAULT_COINS = ['bitcoin','ethereum','solana','cardano','dogecoin']

const AVAILABLE_COINS = [
  { id:'bitcoin',        name:'Bitcoin',       symbol:'BTC' },
  { id:'ethereum',       name:'Ethereum',      symbol:'ETH' },
  { id:'solana',         name:'Solana',        symbol:'SOL' },
  { id:'cardano',        name:'Cardano',       symbol:'ADA' },
  { id:'dogecoin',       name:'Dogecoin',      symbol:'DOGE' },
  { id:'ripple',         name:'XRP',           symbol:'XRP' },
  { id:'polkadot',       name:'Polkadot',      symbol:'DOT' },
  { id:'avalanche-2',    name:'Avalanche',     symbol:'AVAX' },
  { id:'chainlink',      name:'Chainlink',     symbol:'LINK' },
  { id:'uniswap',        name:'Uniswap',       symbol:'UNI' },
  { id:'litecoin',       name:'Litecoin',      symbol:'LTC' },
  { id:'tron',           name:'TRON',          symbol:'TRX' },
  { id:'stellar',        name:'Stellar',       symbol:'XLM' },
  { id:'monero',         name:'Monero',        symbol:'XMR' },
  { id:'shiba-inu',      name:'Shiba Inu',     symbol:'SHIB' },
  { id:'pepe',           name:'Pepe',          symbol:'PEPE' },
  { id:'the-open-network',name:'Toncoin',      symbol:'TON' },
  { id:'sui',            name:'Sui',           symbol:'SUI' },
  { id:'near',           name:'NEAR',          symbol:'NEAR' },
  { id:'aptos',          name:'Aptos',         symbol:'APT' },
]

export default function CryptoWidget({ config, onUpdate }) {
  const coins = config.coins || DEFAULT_COINS
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  function load(ids) {
    setError('')
    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Failed to load prices.'); setLoading(false) })
  }

  useEffect(() => {
    setLoading(true)
    load(coins)
    const t = setInterval(() => load(coins), 60000)
    return () => clearInterval(t)
  }, [coins.join(',')])

  function toggle(id) {
    const next = coins.includes(id) ? coins.filter(c => c !== id) : [...coins, id]
    if (next.length === 0) return // keep at least one
    onUpdate({ coins: next })
  }

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>
  if (error) return <div style={{ color:'var(--red)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{error}</div>

  return (
    <div>
      {!showSettings ? (
        <>
          {data.map(coin => {
            const pos = coin.price_change_percentage_24h >= 0
            return (
              <div key={coin.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <img src={coin.image} alt={coin.symbol} style={{ width:20, height:20, borderRadius:'50%' }} />
                  <div>
                    <div style={{ fontSize:12, fontWeight:700 }}>{coin.name}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", textTransform:'uppercase' }}>{coin.symbol}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>
                    ${coin.current_price?.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                  </div>
                  <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color: pos ? '#4ade80' : 'var(--red)' }}>
                    {pos ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            <div style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>via CoinGecko · auto-refreshes</div>
            <button onClick={() => setShowSettings(true)}
              style={{ background:'none', border:'none', color:'var(--text3)', fontSize:11, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
              ⚙ Edit coins
            </button>
          </div>
        </>
      ) : (
        <>
          {/* My list — reorderable */}
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>My List</div>
          <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:12 }}>
            {coins.map((id, i) => {
              const c = AVAILABLE_COINS.find(x => x.id === id) || { id, name: id, symbol: id }
              return (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:8, background:'rgba(91,127,255,.1)', border:'1px solid var(--accent)' }}>
                  <span style={{ fontSize:12, flex:1 }}>{c.name} <span style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:10 }}>{c.symbol?.toUpperCase()}</span></span>
                  <button onClick={() => { if(i===0) return; const a=[...coins]; [a[i-1],a[i]]=[a[i],a[i-1]]; onUpdate({coins:a}) }}
                    style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:4, color: i===0 ? 'var(--text3)' : 'var(--text2)', cursor: i===0 ? 'default' : 'pointer', fontSize:10, padding:'1px 6px', opacity: i===0 ? 0.3 : 1 }}>▲</button>
                  <button onClick={() => { if(i===coins.length-1) return; const a=[...coins]; [a[i],a[i+1]]=[a[i+1],a[i]]; onUpdate({coins:a}) }}
                    style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:4, color: i===coins.length-1 ? 'var(--text3)' : 'var(--text2)', cursor: i===coins.length-1 ? 'default' : 'pointer', fontSize:10, padding:'1px 6px', opacity: i===coins.length-1 ? 0.3 : 1 }}>▼</button>
                  <button onClick={() => toggle(id)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:12, padding:'0 2px' }}>×</button>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Add Coins</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:180, overflowY:'auto' }}>
            {AVAILABLE_COINS.filter(c => !coins.includes(c.id)).map(c => (
                <div key={c.id} onClick={() => toggle(c.id)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', borderRadius:8, background:'var(--s3)', border:'1px solid var(--border)', cursor:'pointer' }}>
                  <div style={{ fontSize:12 }}>{c.name} <span style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:10 }}>{c.symbol}</span></div>
                  <div style={{ fontSize:11, color:'var(--accent)' }}>+ Add</div>
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

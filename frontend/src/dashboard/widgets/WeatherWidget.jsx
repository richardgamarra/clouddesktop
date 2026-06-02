import { useState, useEffect } from 'react'

const WMO = {
  0:'Clear sky☀️', 1:'Mainly clear🌤️', 2:'Partly cloudy⛅', 3:'Overcast☁️',
  45:'Foggy🌫️', 48:'Icy fog🌫️', 51:'Light drizzle🌦️', 53:'Drizzle🌦️', 55:'Heavy drizzle🌧️',
  61:'Light rain🌧️', 63:'Rain🌧️', 65:'Heavy rain🌧️',
  71:'Light snow❄️', 73:'Snow❄️', 75:'Heavy snow❄️',
  80:'Light showers🌦️', 81:'Showers🌦️', 82:'Heavy showers⛈️',
  95:'Thunderstorm⛈️', 99:'Heavy thunderstorm⛈️',
}
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function wmoInfo(code) {
  const full = WMO[code] || 'Unknown'
  const emoji = [...full].find(c => c.codePointAt(0) > 127) || '🌡️'
  const desc  = full.replace(/[^\x00-\x7F]/g, '').trim()
  return { emoji, desc }
}

function toF(c) { return Math.round(c * 9/5 + 32) }
function fmt(c, unit) { return unit === 'F' ? `${toF(c)}°F` : `${Math.round(c)}°C` }

export default function WeatherWidget({ config, onUpdate }) {
  const { city, lat, lon, unit = 'C' } = config
  const [weather, setWeather]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    if (!lat || !lon) return
    setLoading(true)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=5`)
      .then(r => r.json())
      .then(d => { setWeather(d); setLoading(false) })
      .catch(() => { setError('Failed to load weather.'); setLoading(false) })
  }, [lat, lon])

  async function searchCity() {
    if (!search.trim()) return
    setSearching(true); setSearchError('')
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search.trim())}&count=1&language=en&format=json`)
      const d = await res.json()
      if (d.results?.length) {
        const r = d.results[0]
        onUpdate({ city: r.name, lat: r.latitude, lon: r.longitude })
      } else {
        setSearchError('City not found.')
      }
    } catch {
      setSearchError('Search failed.')
    } finally {
      setSearching(false)
    }
  }

  if (!city) return (
    <div>
      <div style={{ display:'flex', gap:6, marginBottom:6 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city…"
          onKeyDown={e => e.key === 'Enter' && searchCity()}
          style={{ flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 10px', outline:'none' }} />
        <button onClick={searchCity} disabled={searching}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12 }}>
          {searching ? '…' : 'Go'}
        </button>
      </div>
      {searchError && <div style={{ color:'var(--red)', fontSize:11, fontFamily:"'DM Mono',monospace" }}>{searchError}</div>}
    </div>
  )

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>
  if (error)   return <div style={{ color:'var(--red)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{error}</div>
  if (!weather) return null

  const cw    = weather.current_weather
  const daily = weather.daily
  const { emoji, desc } = wmoInfo(cw.weathercode)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700 }}>{city}</div>
          <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{desc}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:28 }}>{emoji}</div>
          <div style={{ fontSize:22, fontWeight:800, fontFamily:"'DM Mono',monospace" }}>{fmt(cw.temperature, unit)}</div>
        </div>
      </div>

      {daily && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {daily.time.slice(0,5).map((date, i) => {
            const { emoji: de } = wmoInfo(daily.weathercode[i])
            const d = new Date(date)
            return (
              <div key={date} style={{ flex:1, minWidth:40, textAlign:'center', background:'var(--s3)', borderRadius:6, padding:'4px 2px' }}>
                <div style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{DAYS[d.getDay()]}</div>
                <div style={{ fontSize:14 }}>{de}</div>
                <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'var(--text2)' }}>
                  {unit === 'F' ? toF(daily.temperature_2m_max[i]) : Math.round(daily.temperature_2m_max[i])}°
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <button onClick={() => onUpdate({ city: '', lat: null, lon: null })}
          style={{ background:'none', border:'none', color:'var(--text3)', fontSize:10, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
          Change city
        </button>
        {/* °C / °F toggle */}
        <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--border2)' }}>
          {['C','F'].map(u => (
            <button key={u} onClick={() => onUpdate({ unit: u })}
              style={{
                padding:'3px 9px', border:'none', cursor:'pointer', fontSize:11,
                fontFamily:"'DM Mono',monospace", fontWeight:700,
                background: unit === u ? 'var(--accent)' : 'var(--s3)',
                color: unit === u ? '#fff' : 'var(--text3)',
                transition:'background .15s, color .15s',
              }}>
              °{u}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

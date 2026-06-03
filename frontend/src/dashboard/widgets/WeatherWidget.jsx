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

const CITY_PRESETS = [
  { name:'Fairfax, VA', lat:38.8462, lon:-77.3064 },
  { name:'New York',    lat:40.7128, lon:-74.0060 },
  { name:'Los Angeles', lat:34.0522, lon:-118.2437 },
  { name:'Chicago',     lat:41.8781, lon:-87.6298 },
  { name:'Miami',       lat:25.7617, lon:-80.1918 },
  { name:'London',      lat:51.5074, lon:-0.1278 },
  { name:'Paris',       lat:48.8566, lon:2.3522 },
  { name:'Tokyo',       lat:35.6762, lon:139.6503 },
  { name:'Sydney',      lat:-33.8688, lon:151.2093 },
  { name:'Dubai',       lat:25.2048, lon:55.2708 },
]

function wmoInfo(code) {
  const full = WMO[code] || 'Unknown'
  const emoji = [...full].find(c => c.codePointAt(0) > 127) || '🌡️'
  const desc  = full.replace(/[^\x00-\x7F]/g, '').trim()
  return { emoji, desc }
}

function toF(c) { return Math.round(c * 9/5 + 32) }
function fmtT(c, unit) { return unit === 'F' ? `${toF(c)}°` : `${Math.round(c)}°` }

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
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&hourly=temperature_2m,weathercode,precipitation_probability&timezone=auto&forecast_days=7`)
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
      } else { setSearchError('City not found.') }
    } catch { setSearchError('Search failed.') }
    finally { setSearching(false) }
  }

  function getTodayHourly() {
    if (!weather?.hourly) return []
    const now = new Date()
    const { time, temperature_2m: temps, weathercode: codes, precipitation_probability: precip } = weather.hourly
    const result = []
    for (let i = 0; i < time.length && result.length < 9; i++) {
      const t = new Date(time[i])
      if (t >= now) result.push({ hour: t.getHours(), temp: temps[i], code: codes[i], precip: precip[i] })
    }
    return result
  }

  if (!city) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', gap:6 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city…"
          onKeyDown={e => e.key === 'Enter' && searchCity()}
          style={{ flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'8px 12px', outline:'none' }} />
        <button onClick={searchCity} disabled={searching}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {searching ? '…' : 'Go'}
        </button>
      </div>
      {searchError && <div style={{ color:'var(--red)', fontSize:11, fontFamily:"'DM Mono',monospace" }}>{searchError}</div>}
      <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Quick pick</div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {CITY_PRESETS.map(p => (
          <div key={p.name} onClick={() => { onUpdate({ city: p.name, lat: p.lat, lon: p.lon }) }}
            style={{ padding:'7px 10px', borderRadius:8, background:'var(--s3)', cursor:'pointer', fontSize:13, color:'var(--text2)' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--s4)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--s3)'}>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'20px 0', textAlign:'center' }}>Loading…</div>
  if (error)   return <div style={{ color:'var(--red)', fontSize:13 }}>{error}</div>
  if (!weather) return null

  const cw     = weather.current_weather
  const daily  = weather.daily
  const hourly = getTodayHourly()
  const { emoji, desc } = wmoInfo(cw.weathercode)
  const tempMain = unit === 'F' ? `${toF(cw.temperature)}°F` : `${Math.round(cw.temperature)}°C`

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, height:'100%' }}>

      {/* ── Hero current conditions ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'linear-gradient(135deg, var(--s2), var(--s3))',
        borderRadius:12, padding:'18px 20px', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.3px' }}>{city}</div>
          <div style={{ fontSize:14, color:'var(--text2)', marginTop:2 }}>{desc}</div>
          <div style={{ fontSize:52, fontWeight:900, fontFamily:"'DM Mono',monospace",
            letterSpacing:'-2px', marginTop:6, color:'var(--text)',
            lineHeight:1 }}>
            {tempMain}
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:4 }}>
            Wind {Math.round(cw.windspeed)} km/h
          </div>
        </div>
        <div style={{ fontSize:72, lineHeight:1, opacity:.9 }}>{emoji}</div>
      </div>

      {/* ── Hourly ── */}
      {hourly.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)',
            textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Today — Hourly</div>
          <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
            {hourly.map((h, i) => {
              const { emoji: he } = wmoInfo(h.code)
              const label = h.hour === 0 ? '12am' : h.hour === 12 ? '12pm' : h.hour > 12 ? `${h.hour-12}pm` : `${h.hour}am`
              return (
                <div key={i} style={{ flex:'0 0 auto', textAlign:'center',
                  background:'var(--s2)', border:'1px solid var(--border)',
                  borderRadius:10, padding:'8px 6px', minWidth:44 }}>
                  <div style={{ fontSize:10, color:'var(--text2)', fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:18, margin:'4px 0' }}>{he}</div>
                  <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--text)', fontWeight:800 }}>{fmtT(h.temp, unit)}</div>
                  {h.precip > 0 && <div style={{ fontSize:9, color:'#60a5fa', fontFamily:"'DM Mono',monospace", marginTop:1 }}>{h.precip}%</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 7-day forecast ── */}
      {daily && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)',
            textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>7-Day Forecast</div>
          <div style={{ display:'flex', gap:5 }}>
            {daily.time.slice(0,7).map((date, i) => {
              const { emoji: de } = wmoInfo(daily.weathercode[i])
              const d = new Date(date)
              const isToday = i === 0
              return (
                <div key={date} style={{ flex:1, textAlign:'center',
                  background: isToday ? 'rgba(91,127,255,.12)' : 'var(--s2)',
                  border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius:10, padding:'8px 4px' }}>
                  <div style={{ fontSize:10, color: isToday ? 'var(--accent2)' : 'var(--text)',
                    fontFamily:"'DM Mono',monospace", fontWeight:700 }}>
                    {isToday ? 'Now' : DAYS[d.getDay()]}
                  </div>
                  <div style={{ fontSize:18, margin:'4px 0' }}>{de}</div>
                  <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--text)', fontWeight:800 }}>
                    {fmtT(daily.temperature_2m_max[i], unit)}
                  </div>
                  <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)' }}>
                    {fmtT(daily.temperature_2m_min[i], unit)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => onUpdate({ city:'', lat:null, lon:null })}
          style={{ background:'none', border:'none', color:'var(--text3)', fontSize:11,
            cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
          Change city
        </button>
        <div style={{ display:'flex', borderRadius:7, overflow:'hidden', border:'1px solid var(--border2)' }}>
          {['C','F'].map(u => (
            <button key={u} onClick={() => onUpdate({ unit: u })}
              style={{ padding:'4px 12px', border:'none', cursor:'pointer', fontSize:12,
                fontFamily:"'DM Mono',monospace", fontWeight:700,
                background: unit === u ? 'var(--accent)' : 'var(--s3)',
                color: unit === u ? '#fff' : 'var(--text3)', transition:'background .15s' }}>
              °{u}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

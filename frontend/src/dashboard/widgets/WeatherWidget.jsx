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

// Quick-pick city presets
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
  const [weather, setWeather]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  useEffect(() => {
    if (!lat || !lon) return
    setLoading(true)
    // Include hourly forecast for today
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
        setShowPresets(false)
      } else {
        setSearchError('City not found.')
      }
    } catch {
      setSearchError('Search failed.')
    } finally {
      setSearching(false)
    }
  }

  function pickPreset(p) {
    onUpdate({ city: p.name, lat: p.lat, lon: p.lon })
    setShowPresets(false)
  }

  // Get today's hourly data (next 12 hours from now)
  function getTodayHourly() {
    if (!weather?.hourly) return []
    const now = new Date()
    const currentHour = now.getHours()
    const times = weather.hourly.time
    const temps = weather.hourly.temperature_2m
    const codes = weather.hourly.weathercode
    const precip = weather.hourly.precipitation_probability

    // Find today's hours starting from current hour
    const result = []
    for (let i = 0; i < times.length && result.length < 8; i++) {
      const t = new Date(times[i])
      if (t >= now || (t.getHours() === currentHour && t.getDate() === now.getDate())) {
        result.push({
          hour: t.getHours(),
          temp: temps[i],
          code: codes[i],
          precip: precip[i],
        })
      }
    }
    return result
  }

  if (!city) return (
    <div>
      {/* Search */}
      <div style={{ display:'flex', gap:6, marginBottom:6 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city…"
          onKeyDown={e => e.key === 'Enter' && searchCity()}
          style={{ flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 10px', outline:'none' }} />
        <button onClick={searchCity} disabled={searching}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12 }}>
          {searching ? '…' : 'Go'}
        </button>
      </div>
      {searchError && <div style={{ color:'var(--red)', fontSize:11, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>{searchError}</div>}

      {/* Quick picks */}
      <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Quick pick</div>
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        {CITY_PRESETS.map(p => (
          <div key={p.name} onClick={() => pickPreset(p)}
            style={{ padding:'5px 8px', borderRadius:6, background:'var(--s3)', cursor:'pointer', fontSize:12, color:'var(--text2)' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--s4)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--s3)'}>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>
  if (error)   return <div style={{ color:'var(--red)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{error}</div>
  if (!weather) return null

  const cw    = weather.current_weather
  const daily = weather.daily
  const hourly = getTodayHourly()
  const { emoji, desc } = wmoInfo(cw.weathercode)

  return (
    <div>
      {/* Current conditions */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700 }}>{city}</div>
          <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{desc}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:28 }}>{emoji}</div>
          <div style={{ fontSize:22, fontWeight:800, fontFamily:"'DM Mono',monospace" }}>
            {unit === 'F' ? `${toF(cw.temperature)}°F` : `${Math.round(cw.temperature)}°C`}
          </div>
        </div>
      </div>

      {/* Hourly forecast today */}
      {hourly.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Today — hourly</div>
          <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
            {hourly.map((h, i) => {
              const { emoji: he } = wmoInfo(h.code)
              const label = h.hour === 0 ? '12am' : h.hour === 12 ? '12pm' : h.hour > 12 ? `${h.hour-12}pm` : `${h.hour}am`
              return (
                <div key={i} style={{ flex:'0 0 auto', textAlign:'center', background:'var(--s3)', borderRadius:6, padding:'4px 6px', minWidth:38 }}>
                  <div style={{ fontSize:9, color:'var(--text)', fontFamily:"'DM Mono',monospace" }}>{label}</div>
                  <div style={{ fontSize:13, margin:'2px 0' }}>{he}</div>
                  <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'var(--text)', fontWeight:700 }}>{fmtT(h.temp, unit)}</div>
                  {h.precip > 0 && <div style={{ fontSize:8, color:'#60a5fa', fontFamily:"'DM Mono',monospace" }}>{h.precip}%</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5-day forecast */}
      {daily && (
        <div style={{ display:'flex', gap:5, marginBottom:8 }}>
          {daily.time.slice(0,7).map((date, i) => {
            const { emoji: de } = wmoInfo(daily.weathercode[i])
            const d = new Date(date)
            return (
              <div key={date} style={{ flex:1, minWidth:36, textAlign:'center', background:'var(--s3)', borderRadius:6, padding:'4px 2px' }}>
                <div style={{ fontSize:9, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{DAYS[d.getDay()]}</div>
                <div style={{ fontSize:13 }}>{de}</div>
                <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'var(--text)', fontWeight:700 }}>
                  {fmtT(daily.temperature_2m_max[i], unit)}
                </div>
                <div style={{ fontSize:8, fontFamily:"'DM Mono',monospace", color:'var(--text2)' }}>
                  {fmtT(daily.temperature_2m_min[i], unit)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => onUpdate({ city: '', lat: null, lon: null })}
          style={{ background:'none', border:'none', color:'var(--text3)', fontSize:10, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
          Change city
        </button>
        <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--border2)' }}>
          {['C','F'].map(u => (
            <button key={u} onClick={() => onUpdate({ unit: u })}
              style={{ padding:'3px 9px', border:'none', cursor:'pointer', fontSize:11, fontFamily:"'DM Mono',monospace", fontWeight:700,
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

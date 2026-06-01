import { useState, useEffect } from 'react'

const COMMON_TIMEZONES = [
  { name: 'New York',    tz: 'America/New_York' },
  { name: 'Los Angeles', tz: 'America/Los_Angeles' },
  { name: 'Chicago',     tz: 'America/Chicago' },
  { name: 'London',      tz: 'Europe/London' },
  { name: 'Paris',       tz: 'Europe/Paris' },
  { name: 'Berlin',      tz: 'Europe/Berlin' },
  { name: 'Dubai',       tz: 'Asia/Dubai' },
  { name: 'Mumbai',      tz: 'Asia/Kolkata' },
  { name: 'Singapore',   tz: 'Asia/Singapore' },
  { name: 'Tokyo',       tz: 'Asia/Tokyo' },
  { name: 'Sydney',      tz: 'Australia/Sydney' },
  { name: 'São Paulo',   tz: 'America/Sao_Paulo' },
]

function getTime(tz) {
  const now = new Date()
  return {
    time: new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now),
    date: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(now),
  }
}

function ClockCard({ city, onRemove }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const { time, date } = getTime(city.tz)
  return (
    <div className="clock-card">
      <div className="clock-tz">{city.tz}</div>
      <div className="clock-city">{city.name}</div>
      <div className="clock-time">{time}</div>
      <div className="clock-date">{date}</div>
      <button className="clock-remove" onClick={onRemove}>×</button>
    </div>
  )
}

export default function WorldClockTab({ tab, onUpdateTab }) {
  const cities = tab.config.cities || []

  function addCity(tz) {
    if (cities.find(c => c.tz === tz)) return
    const def = COMMON_TIMEZONES.find(c => c.tz === tz)
    onUpdateTab(tab.id, { config: { ...tab.config, cities: [...cities, def || { name: tz, tz }] } })
  }

  function removeCity(tz) {
    onUpdateTab(tab.id, { config: { ...tab.config, cities: cities.filter(c => c.tz !== tz) } })
  }

  const available = COMMON_TIMEZONES.filter(c => !cities.find(e => e.tz === c.tz))

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:800 }}>🕐 World Clock</h2>
        {available.length > 0 && (
          <select onChange={e => { if (e.target.value) addCity(e.target.value); e.target.value = '' }}
            style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'5px 10px', cursor:'pointer', appearance:'none' }}>
            <option value="">+ Add city…</option>
            {available.map(c => <option key={c.tz} value={c.tz}>{c.name}</option>)}
          </select>
        )}
      </div>
      {cities.length === 0 && (
        <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>No cities added. Use the dropdown above to add one.</div>
      )}
      <div className="worldclock-grid">
        {cities.map(city => <ClockCard key={city.tz} city={city} onRemove={() => removeCity(city.tz)} />)}
      </div>
    </div>
  )
}

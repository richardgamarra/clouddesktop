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

export default function ClockWidget({ config, onUpdate }) {
  const cities = config.cities || []
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  function addCity(tz) {
    if (cities.find(c => c.tz === tz)) return
    const def = COMMON_TIMEZONES.find(c => c.tz === tz)
    onUpdate({ cities: [...cities, def || { name: tz, tz }] })
  }

  function removeCity(tz) {
    onUpdate({ cities: cities.filter(c => c.tz !== tz) })
  }

  const available = COMMON_TIMEZONES.filter(c => !cities.find(e => e.tz === c.tz))

  return (
    <div>
      {available.length > 0 && (
        <select onChange={e => { if (e.target.value) addCity(e.target.value); e.target.value = '' }}
          style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:11, padding:'4px 8px', cursor:'pointer', marginBottom:10, width:'100%' }}>
          <option value="">+ Add city…</option>
          {available.map(c => <option key={c.tz} value={c.tz}>{c.name}</option>)}
        </select>
      )}
      {cities.length === 0 && (
        <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Add a city using the dropdown above.</div>
      )}
      {cities.map(city => {
        const { time, date } = getTime(city.tz)
        return (
          <div key={city.tz} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{city.name}</div>
              <div style={{ fontSize:18, fontFamily:"'DM Mono',monospace", fontWeight:700, letterSpacing:'.05em' }}>{time}</div>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{date}</div>
            </div>
            <button onClick={() => removeCity(city.tz)}
              style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, lineHeight:1, padding:'4px 6px' }}
              onMouseEnter={e => e.target.style.color = 'var(--red)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>×</button>
          </div>
        )
      })}
    </div>
  )
}

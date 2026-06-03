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
    date: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }).format(now),
    dateShort: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(now),
  }
}

export default function ClockWidget({ config, onUpdate }) {
  const cities = config.cities || []
  const [tick, setTick] = useState(0)
  const single = cities.length === 1

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
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Add city dropdown */}
      {available.length > 0 && (
        <select onChange={e => { if (e.target.value) addCity(e.target.value); e.target.value = '' }}
          style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:11, padding:'4px 8px', cursor:'pointer', marginBottom: cities.length ? 10 : 0, width:'100%' }}>
          <option value="">+ Add city…</option>
          {available.map(c => <option key={c.tz} value={c.tz}>{c.name}</option>)}
        </select>
      )}

      {cities.length === 0 && (
        <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12, marginTop:4 }}>Add a city using the dropdown above.</div>
      )}

      {/* Single city — large display fills card */}
      {single && (() => {
        const city = cities[0]
        const { time, date } = getTime(city.tz)
        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'12px 0 4px', textAlign:'center', position:'relative' }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.15em', marginBottom:6 }}>{city.name}</div>
            <div style={{ fontSize:52, fontFamily:"'DM Mono',monospace", fontWeight:800, letterSpacing:'-.02em', color:'var(--accent2)', lineHeight:1 }}>{time}</div>
            <div style={{ fontSize:13, color:'var(--text2)', fontFamily:"'DM Mono',monospace", marginTop:8 }}>{date}</div>
            <button onClick={() => removeCity(city.tz)}
              style={{ position:'absolute', top:0, right:0, background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, lineHeight:1, padding:'2px 4px' }}
              onMouseEnter={e => e.target.style.color='var(--red)'}
              onMouseLeave={e => e.target.style.color='var(--text3)'}>×</button>
          </div>
        )
      })()}

      {/* Multiple cities — compact rows */}
      {!single && cities.map(city => {
        const { time, dateShort } = getTime(city.tz)
        return (
          <div key={city.tz} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{city.name}</div>
              <div style={{ fontSize:20, fontFamily:"'DM Mono',monospace", fontWeight:700, letterSpacing:'.03em', color:'var(--accent2)' }}>{time}</div>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{dateShort}</div>
            </div>
            <button onClick={() => removeCity(city.tz)}
              style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, lineHeight:1, padding:'4px 6px' }}
              onMouseEnter={e => e.target.style.color='var(--red)'}
              onMouseLeave={e => e.target.style.color='var(--text3)'}>×</button>
          </div>
        )
      })}
    </div>
  )
}

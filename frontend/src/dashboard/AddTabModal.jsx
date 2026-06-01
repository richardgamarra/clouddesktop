import { useState } from 'react'

const TAB_TYPES = [
  { type: 'webpage',    icon: '🌐', name: 'Web Page',    desc: 'Embed any public URL in a panel' },
  { type: 'bookmarks', icon: '🔖', name: 'Bookmarks',   desc: 'Quick-launch link grid' },
  { type: 'notes',     icon: '📝', name: 'Notes',       desc: 'Persistent scratch pad, auto-saves' },
  { type: 'worldclock',icon: '🕐', name: 'World Clock', desc: 'Multiple timezone clocks' },
  { type: 'weather',   icon: '🌦️', name: 'Weather',     desc: 'Live city forecast' },
]

const COMMON_TIMEZONES = [
  { name: 'New York',    tz: 'America/New_York' },
  { name: 'Los Angeles', tz: 'America/Los_Angeles' },
  { name: 'London',      tz: 'Europe/London' },
  { name: 'Paris',       tz: 'Europe/Paris' },
  { name: 'Dubai',       tz: 'Asia/Dubai' },
  { name: 'Tokyo',       tz: 'Asia/Tokyo' },
  { name: 'Sydney',      tz: 'Australia/Sydney' },
  { name: 'São Paulo',   tz: 'America/Sao_Paulo' },
]

export default function AddTabModal({ onAdd, onClose }) {
  const [step, setStep]   = useState('pick')
  const [chosen, setChosen] = useState(null)
  const [tabName, setTabName] = useState('')
  const [webUrl, setWebUrl]   = useState('')
  const [weatherCity, setWeatherCity] = useState('')
  const [weatherSearching, setWeatherSearching] = useState(false)
  const [weatherResult, setWeatherResult] = useState(null)
  const [weatherError, setWeatherError] = useState('')
  const [clockCities, setClockCities] = useState([{ name: 'New York', tz: 'America/New_York' }])

  function pick(t) {
    setChosen(t)
    setTabName(t.name)
    setStep('config')
  }

  async function searchWeatherCity() {
    if (!weatherCity.trim()) return
    setWeatherSearching(true)
    setWeatherError('')
    setWeatherResult(null)
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity.trim())}&count=1&language=en&format=json`)
      const d = await res.json()
      if (d.results?.length) {
        setWeatherResult(d.results[0])
      } else {
        setWeatherError('City not found. Try a different spelling.')
      }
    } catch {
      setWeatherError('Search failed. Check your connection.')
    } finally {
      setWeatherSearching(false)
    }
  }

  function addClockCity(tz) {
    const def = COMMON_TIMEZONES.find(c => c.tz === tz)
    if (!clockCities.find(c => c.tz === tz)) {
      setClockCities(prev => [...prev, def || { name: tz, tz }])
    }
  }

  function removeClockCity(tz) {
    setClockCities(prev => prev.filter(c => c.tz !== tz))
  }

  function handleAdd() {
    const name = tabName.trim() || chosen.name
    let config = {}
    if (chosen.type === 'webpage')    config = { url: webUrl.trim() }
    if (chosen.type === 'bookmarks')  config = { items: [] }
    if (chosen.type === 'notes')      config = {}
    if (chosen.type === 'worldclock') config = { cities: clockCities }
    if (chosen.type === 'weather') {
      if (!weatherResult) return
      config = { city: weatherResult.name, lat: weatherResult.latitude, lon: weatherResult.longitude }
    }
    onAdd({ type: chosen.type, name, icon: chosen.icon, config })
    onClose()
  }

  function canAdd() {
    if (!chosen) return false
    if (chosen.type === 'webpage' && !webUrl.trim()) return false
    if (chosen.type === 'weather' && !weatherResult) return false
    return true
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 480 }}>
        {step === 'pick' && (
          <>
            <div className="modal-title">Add a New Tab</div>
            <div className="modal-sub">Choose what this tab shows</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {TAB_TYPES.map(t => (
                <div key={t.type} onClick={() => pick(t)}
                  style={{ background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '14px 12px', cursor: 'pointer', transition: 'all var(--t)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(91,127,255,.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)' }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {step === 'config' && chosen && (
          <>
            <div className="modal-title">{chosen.icon} {chosen.name}</div>
            <div className="modal-sub">Configure your new tab</div>

            <div className="field">
              <label>Tab Name</label>
              <input type="text" value={tabName} onChange={e => setTabName(e.target.value)} placeholder={chosen.name} maxLength={30} autoFocus />
            </div>

            {chosen.type === 'webpage' && (
              <div className="field">
                <label>URL</label>
                <input type="url" value={webUrl} onChange={e => setWebUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}

            {chosen.type === 'weather' && (
              <div>
                <div className="weather-search">
                  <input type="text" value={weatherCity} onChange={e => setWeatherCity(e.target.value)}
                    placeholder="Search city…"
                    style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'9px 12px', outline:'none', flex:1 }}
                    onKeyDown={e => { if (e.key === 'Enter') searchWeatherCity() }} />
                  <button className="btn-primary" style={{ width: 'auto', padding: '9px 14px', fontSize: 12 }} onClick={searchWeatherCity} disabled={weatherSearching}>
                    {weatherSearching ? '…' : 'Search'}
                  </button>
                </div>
                {weatherError && <div className="auth-error" style={{ marginBottom: 12 }}>{weatherError}</div>}
                {weatherResult && (
                  <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700 }}>{weatherResult.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                      {weatherResult.country} · {weatherResult.latitude.toFixed(2)}, {weatherResult.longitude.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {chosen.type === 'worldclock' && (
              <div>
                <div className="field">
                  <label>Add city</label>
                  <select onChange={e => { if (e.target.value) addClockCity(e.target.value); e.target.value = '' }}
                    style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'9px 12px', cursor:'pointer', appearance:'none' }}>
                    <option value="">— Pick a timezone —</option>
                    {COMMON_TIMEZONES.map(c => <option key={c.tz} value={c.tz}>{c.name} ({c.tz})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {clockCities.map(c => (
                    <div key={c.tz} style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:20, padding:'3px 10px 3px 12px', fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
                      {c.name}
                      <button onClick={() => removeClockCity(c.tz)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:12, lineHeight:1, padding:0 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(chosen.type === 'notes' || chosen.type === 'bookmarks') && (
              <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12, color:'var(--text2)', fontFamily:"'DM Mono',monospace" }}>
                {chosen.type === 'notes' ? 'Your notes auto-save as you type and persist across sessions.' : 'Add bookmarks after creating the tab by clicking the + card.'}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setStep('pick')}>← Back</button>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleAdd} disabled={!canAdd()}>Add Tab →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

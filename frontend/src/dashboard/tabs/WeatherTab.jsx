import { useState, useEffect } from 'react'

const WMO = {
  0:'Clear sky☀️', 1:'Mainly clear🌤️', 2:'Partly cloudy⛅', 3:'Overcast☁️',
  45:'Foggy🌫️', 48:'Icy fog🌫️', 51:'Light drizzle🌦️', 53:'Drizzle🌦️', 55:'Heavy drizzle🌧️',
  61:'Light rain🌧️', 63:'Rain🌧️', 65:'Heavy rain🌧️',
  71:'Light snow❄️', 73:'Snow❄️', 75:'Heavy snow❄️',
  77:'Snow grains🌨️', 80:'Light showers🌦️', 81:'Showers🌦️', 82:'Heavy showers⛈️',
  95:'Thunderstorm⛈️', 96:'Thunderstorm with hail⛈️', 99:'Heavy thunderstorm⛈️',
}

function wmoInfo(code) {
  const full = WMO[code] || 'Unknown'
  const emoji = [...full].find(c => c.codePointAt(0) > 127) || '🌡️'
  const desc  = full.replace(/[^\x00-\x7F]/g, '').trim()
  return { emoji, desc }
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function WeatherTab({ tab }) {
  const { city, lat, lon } = tab.config
  const [weather, setWeather] = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lat || !lon) { setLoading(false); return }
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=7`)
      .then(r => r.json())
      .then(d => { setWeather(d); setLoading(false) })
      .catch(() => { setError('Failed to load weather.'); setLoading(false) })
  }, [lat, lon])

  if (!city) return (
    <div className="custom-tab-panel" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>No city configured.</div>
    </div>
  )
  if (loading) return (
    <div className="custom-tab-panel" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading weather for {city}…</div>
    </div>
  )
  if (error) return <div className="custom-tab-panel"><div className="auth-error">{error}</div></div>

  const cw    = weather.current_weather
  const daily = weather.daily
  const { emoji: currentEmoji, desc: currentDesc } = wmoInfo(cw.weathercode)

  return (
    <div className="custom-tab-panel">
      <div className="weather-panel">
        <div className="weather-city-name">{city}</div>
        <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:8 }}>
          {lat.toFixed(2)}, {lon.toFixed(2)}
        </div>
        <div className="weather-current">
          <div style={{ fontSize:56 }}>{currentEmoji}</div>
          <div>
            <div className="weather-temp">{Math.round(cw.temperature)}°C</div>
            <div className="weather-desc">{currentDesc}</div>
            <div className="weather-detail">Wind: {Math.round(cw.windspeed)} km/h</div>
          </div>
        </div>
        {daily && (
          <div className="weather-daily">
            {daily.time.map((date, i) => {
              const { emoji } = wmoInfo(daily.weathercode[i])
              const d = new Date(date)
              return (
                <div key={date} className="weather-day">
                  <div className="weather-day-name">{DAYS[d.getDay()]}</div>
                  <div className="weather-day-icon">{emoji}</div>
                  <div className="weather-day-temp">{Math.round(daily.temperature_2m_max[i])}° / {Math.round(daily.temperature_2m_min[i])}°</div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ marginTop:20, fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
          Weather data from Open-Meteo.com · Free, no API key
        </div>
      </div>
    </div>
  )
}

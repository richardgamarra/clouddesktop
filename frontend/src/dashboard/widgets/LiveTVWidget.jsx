import { useState, useRef, useEffect } from 'react'

const CHANNELS = [
  // English News — verified June 2026
  { id: 'sky',      name: 'Sky News',   flag: '🇬🇧', ytId: 'YDvsBbKfLPA', cat: 'english' },
  { id: 'al',       name: 'Al Jazeera',flag: '🌍',  ytId: 'gCNeDWCI0vo', cat: 'english' },
  { id: 'france24', name: 'France 24', flag: '🇫🇷', ytId: 'HvZt-nh9sGg', cat: 'english' },
  { id: 'dw',       name: 'DW News',   flag: '🇩🇪', ytId: 'LuKwFajn37U', cat: 'english' },
  { id: 'nhk',      name: 'NHK World', flag: '🇯🇵', ytId: 'f0lYkdA-Gtw', cat: 'english' },
  // Spanish News — verified June 2026
  { id: 'dw_es',    name: 'DW Español',   flag: '🇩🇪', ytId: 'yZh3xsFqCt8', cat: 'spanish' },
  { id: 'rtve',     name: 'RTVE 24H',     flag: '🇪🇸', ytId: 'b4tE5aKhtlg', cat: 'spanish' },
  { id: 'milenio',  name: 'Milenio TV',   flag: '🇲🇽', ytId: 'tQ941SU5UR0', cat: 'spanish' },
]

export default function LiveTVWidget() {
  const [active, setActive] = useState('')
  const [error, setError]   = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    function onMessage(e) {
      if (!e.data) return
      let data
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch { return }
      if (data.event === 'onError') setError(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

const activeCh = CHANNELS.find(c => c.id === active)

  const groups = [
    { label: '🌍 English', channels: CHANNELS.filter(c => c.cat === 'english') },
    { label: '🇪🇸 Español', channels: CHANNELS.filter(c => c.cat === 'spanish') },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Player — always on top */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border2)', background: '#000' }}>
        {active ? (
          <>
            <iframe
              ref={iframeRef}
              src=""
              width="100%"
              height="185"
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="origin"
              style={{ display: 'block' }}
              title="Live TV"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: 'var(--s2)' }}>
              <span style={{ fontSize: 14 }}>{activeCh?.flag}</span>
              <span style={{ fontSize: 12, fontWeight: 700, flex: 1, color: 'var(--text)' }}>
                {activeCh?.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--green)', fontFamily: "'DM Mono',monospace" }}>● LIVE</span>
              {error && (
                <a href={`https://www.youtube.com/watch?v=${activeCh?.ytId}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: "'DM Mono',monospace", textDecoration: 'none', marginLeft: 6 }}>
                  ↗ YouTube
                </a>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📺</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>Select a channel below</span>
          </div>
        )}
      </div>

      {/* Scrollable channel list */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {groups.map(g => (
          <div key={g.label}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", padding: '5px 8px 3px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {g.label}
            </div>
            {g.channels.map(ch => {
              const isActive = ch.id === active
              return (
                <button key={ch.id}
                  onClick={() => { setActive(ch.id); setError(false); const origin = encodeURIComponent(location.origin); if (iframeRef.current) iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${ch.ytId}?autoplay=1&rel=0&enablejsapi=1&origin=${origin}` }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px',
                    borderRadius: 6, cursor: 'pointer', textAlign: 'left', border: 'none',
                    background: isActive ? 'rgba(91,127,255,.18)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text)',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--s3)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{ch.flag}</span>
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, flex: 1 }}>{ch.name}</span>
                  {isActive && <span style={{ fontSize: 8, color: 'var(--green)', flexShrink: 0 }}>●</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>

    </div>
  )
}

import { useState, useRef, useEffect } from 'react'

const CHANNELS = [
  // World News — IDs verified June 2026
  { id: 'sky',       name: 'Sky News',    flag: '🇬🇧', ytId: 'YDvsBbKfLPA', cat: 'news' },
  { id: 'al',        name: 'Al Jazeera', flag: '🌍',  ytId: 'gCNeDWCI0vo', cat: 'news' },
  { id: 'france24',  name: 'France 24',  flag: '🇫🇷', ytId: 'HvZt-nh9sGg', cat: 'news' },
  { id: 'dw',        name: 'DW News',    flag: '🇩🇪', ytId: 'LuKwFajn37U', cat: 'news' },
  { id: 'euronews',  name: 'Euronews',   flag: '🇪🇺', ytId: 'zn58XQ1Bsco', cat: 'news' },
  { id: 'trt',       name: 'TRT World',  flag: '🇹🇷', ytId: 'oNPnQCm7HBs', cat: 'news' },
  { id: 'wion',      name: 'WION',       flag: '🌐',  ytId: 'FuHK15xggBU', cat: 'news' },
  { id: 'france24fr',name: 'France 24 FR',flag: '🇫🇷', ytId: 'Y7iJcCyb6gE', cat: 'news' },
  // Business
  { id: 'bloomberg', name: 'Bloomberg',  flag: '💹',  ytId: 'dp8PhLsUcFE', cat: 'business' },
  // Asia & Pacific
  { id: 'nhk',       name: 'NHK World',  flag: '🇯🇵', ytId: 'f0lYkdA-Gtw', cat: 'asia' },
  { id: 'cgtn',      name: 'CGTN',       flag: '🇨🇳', ytId: 'QMFbKYdFKDQ', cat: 'asia' },
  { id: 'arirang',   name: 'Arirang',    flag: '🇰🇷', ytId: 'GKoOPdBS2g0', cat: 'asia' },
]

const CATS = [
  { key: 'all',      label: 'All' },
  { key: 'news',     label: '🌍 World News' },
  { key: 'business', label: '💹 Business' },
  { key: 'asia',     label: '🌏 Asia & Pacific' },
]

export default function LiveTVWidget() {
  const [active, setActive]   = useState(null)
  const [cat, setCat]         = useState('all')
  const [error, setError]     = useState(false)
  const iframeRef = useRef(null)

  const filtered = cat === 'all' ? CHANNELS : CHANNELS.filter(c => c.cat === cat)

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

  function play(ch) {
    setActive(ch.id)
    setError(false)
    const origin = encodeURIComponent(location.origin)
    if (iframeRef.current) {
      iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${ch.ytId}?autoplay=1&rel=0&enablejsapi=1&origin=${origin}`
    }
  }

  const activeCh = CHANNELS.find(c => c.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Player */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--s2)' }}>
              <span style={{ fontSize: 16 }}>{activeCh?.flag}</span>
              <span style={{ fontSize: 12, fontWeight: 700, flex: 1, color: 'var(--text1)' }}>
                {activeCh?.name}
                <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--green)', fontFamily: "'DM Mono',monospace" }}>● LIVE</span>
              </span>
              {error && (
                <a href={`https://www.youtube.com/watch?v=${activeCh?.ytId}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: "'DM Mono',monospace", textDecoration: 'none' }}>
                  Watch on YouTube ↗
                </a>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: 185, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 32 }}>📺</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>Select a channel to watch live</span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Mono',monospace",
              background: cat === c.key ? 'var(--accent)' : 'var(--s3)',
              color: cat === c.key ? '#fff' : 'var(--text2)',
              border: `1px solid ${cat === c.key ? 'var(--accent)' : 'var(--border)'}`,
              fontWeight: cat === c.key ? 700 : 400,
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Channel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
        {filtered.map(ch => {
          const isActive = ch.id === active
          return (
            <button key={ch.id} onClick={() => play(ch)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                background: isActive ? 'rgba(91,127,255,.18)' : 'var(--s3)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.borderColor = 'var(--border2)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.borderColor = 'var(--border)' } }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{ch.flag}</span>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent)' : 'var(--text1)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ch.name}
              </span>
              {isActive && <span style={{ fontSize: 7, color: 'var(--green)', marginLeft: 'auto', flexShrink: 0 }}>●</span>}
            </button>
          )
        })}
      </div>

    </div>
  )
}

import { useState } from 'react'

const PRESETS = [
  { label:'Top 50 Global',    url:'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF' },
  { label:'Pop Rising',       url:'https://open.spotify.com/playlist/37i9dQZF1DWUa8ZRTfalHk' },
  { label:'Peaceful Piano',   url:'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  { label:'Jazz Vibes',       url:'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT' },
  { label:'80s Hits',         url:'https://open.spotify.com/playlist/37i9dQZF1DX4UtSsGT1Sbe' },
  { label:'Rock Classics',    url:'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U' },
  { label:'Deep Focus',       url:'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  { label:'Chill Hits',       url:'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6' },
]

function toEmbedUrl(url) {
  try {
    // Spotify: https://open.spotify.com/playlist/ID → https://open.spotify.com/embed/playlist/ID
    if (url.includes('spotify.com')) {
      const u = new URL(url)
      const parts = u.pathname.split('/').filter(Boolean) // ['playlist','37i...']
      if (parts.length >= 2) {
        return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator&theme=0`
      }
    }
    // YouTube Music / YouTube: convert to embed
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const u = new URL(url)
      const vid = u.searchParams.get('v') || u.pathname.split('/').pop()
      if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1`
    }
    return null
  } catch { return null }
}

export default function MusicWidget({ config, onUpdate }) {
  const [inputUrl, setInputUrl] = useState('')
  const embedUrl = config.embedUrl || ''

  function applyUrl(url) {
    const embed = toEmbedUrl(url.trim())
    if (embed) {
      onUpdate({ embedUrl: embed, sourceUrl: url.trim() })
      setInputUrl('')
    }
  }

  if (!embedUrl) return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>🎵 Music Player</div>
      <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:12 }}>
        Paste a Spotify or YouTube URL
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        <input value={inputUrl} onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyUrl(inputUrl)}
          placeholder="https://open.spotify.com/playlist/..."
          style={{ flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:7,
            color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:11,
            padding:'7px 10px', outline:'none' }} />
        <button onClick={() => applyUrl(inputUrl)}
          style={{ background:'var(--accent)', border:'none', borderRadius:7, color:'#fff',
            fontSize:12, fontWeight:700, padding:'7px 12px', cursor:'pointer' }}>▶</button>
      </div>

      <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)',
        textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Spotify Presets</div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {PRESETS.map(p => (
          <div key={p.url} onClick={() => applyUrl(p.url)}
            style={{ padding:'6px 10px', borderRadius:7, background:'var(--s3)',
              border:'1px solid var(--border)', cursor:'pointer', fontSize:12,
              display:'flex', alignItems:'center', gap:8 }}
            onMouseEnter={e => e.currentTarget.style.background='var(--s4)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--s3)'}>
            <span style={{ fontSize:14 }}>🎵</span>
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="380"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ borderRadius:12, border:'none' }}
      />
      <div style={{ display:'flex', gap:6 }}>
        <input value={inputUrl} onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyUrl(inputUrl)}
          placeholder="Change playlist/track URL…"
          style={{ flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:7,
            color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:11,
            padding:'6px 10px', outline:'none' }} />
        <button onClick={() => applyUrl(inputUrl)}
          style={{ background:'var(--accent)', border:'none', borderRadius:7, color:'#fff',
            fontSize:11, padding:'6px 10px', cursor:'pointer' }}>Change</button>
        <button onClick={() => onUpdate({ embedUrl: '', sourceUrl: '' })}
          style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:7,
            color:'var(--text3)', fontSize:11, padding:'6px 10px', cursor:'pointer' }}>✕</button>
      </div>
    </div>
  )
}

import { useState } from 'react'

const PRESETS = [
  // Spotify
  { name:'🟢 Top 50 Global',   url:'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF' },
  { name:'🟢 Peaceful Piano',  url:'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  { name:'🟢 Jazz Vibes',      url:'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT' },
  { name:'🟢 80s Hits',        url:'https://open.spotify.com/playlist/37i9dQZF1DX4UtSsGT1Sbe' },
  { name:'🟢 Rock Classics',   url:'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U' },
  { name:'🟢 Deep Focus',      url:'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  { name:'🟢 Chill Hits',      url:'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6' },
  // YouTube (embedding allowed)
  { name:'🔴 Lofi Hip Hop',    url:'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
  { name:'🔴 Jazz BGM',        url:'https://www.youtube.com/watch?v=Dx5qFachd3A' },
  { name:'🔴 Classical Study', url:'https://www.youtube.com/watch?v=4To8-GW_Gvk' },
  { name:'🔴 80s Pop Mix',     url:'https://www.youtube.com/watch?v=oDPxhDQgOAs' },
  { name:'🔴 70s Hits',        url:'https://www.youtube.com/watch?v=wiyS6BFYTV8' },
]

function toEmbedUrl(url) {
  try {
    if (url.includes('spotify.com')) {
      const u = new URL(url)
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator&theme=0`
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const u = new URL(url)
      // Playlist
      const list = u.searchParams.get('list')
      if (list) return `https://www.youtube.com/embed/videoseries?list=${list}&autoplay=1`
      // Single video
      const vid = u.searchParams.get('v') || u.pathname.split('/').pop()
      if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1`
    }
    return null
  } catch { return null }
}

function getSource(url) {
  if (url.includes('spotify.com')) return '🟢 Spotify'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return '🔴 YouTube'
  return '🎵'
}

export default function MusicWidget({ config, onUpdate }) {
  const playlists = config.playlists || []
  const current   = config.current || null  // { name, url, embedUrl }

  const [showAdd,   setShowAdd]   = useState(false)
  const [showList,  setShowList]  = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newUrl,    setNewUrl]    = useState('')
  const [nameError, setNameError] = useState('')

  function play(pl) {
    onUpdate({ current: pl })
    setShowList(false)
  }

  function saveAndPlay() {
    const name = newName.trim() || 'My Playlist'
    const url  = newUrl.trim()
    if (!url) return
    const embedUrl = toEmbedUrl(url)
    if (!embedUrl) { setNameError('Invalid URL — paste a Spotify or YouTube link'); return }
    const pl = { id: 'pl_' + Date.now(), name, url, embedUrl, source: getSource(url) }
    const updated = [...playlists, pl]
    onUpdate({ playlists: updated, current: pl })
    setNewName(''); setNewUrl(''); setNameError(''); setShowAdd(false)
  }

  function applyPreset(p) {
    const embedUrl = toEmbedUrl(p.url)
    if (!embedUrl) return
    const pl = { id: 'pl_' + Date.now(), name: p.name, url: p.url, embedUrl, source: '🟢 Spotify' }
    const already = playlists.find(x => x.url === p.url)
    const updated = already ? playlists : [...playlists, pl]
    onUpdate({ playlists: updated, current: already || pl })
    setShowList(false)
  }

  function removePl(id) {
    const updated = playlists.filter(p => p.id !== id)
    const newCurrent = current?.id === id ? (updated[0] || null) : current
    onUpdate({ playlists: updated, current: newCurrent })
  }

  const iStyle = {
    flex:1, background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:7,
    color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:11,
    padding:'6px 10px', outline:'none', width:'100%',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

      {/* Player */}
      {current?.embedUrl ? (
        <>
          <iframe src={current.embedUrl} width="100%" height="352" frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy" style={{ borderRadius:12, border:'none', display:'block' }} />
          {current.source?.includes('YouTube') && (
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace",
              padding:'4px 8px', background:'rgba(255,91,110,.08)', borderRadius:6,
              border:'1px solid rgba(255,91,110,.2)', lineHeight:1.5 }}>
              ⚠ If you see Error 153, this video has embedding disabled. Try a preset below or paste a different YouTube URL.
            </div>
          )}
        </>
      ) : (
        <div style={{ height:120, display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', background:'var(--s2)', borderRadius:12,
          border:'1px solid var(--border)', gap:8 }}>
          <div style={{ fontSize:32 }}>🎵</div>
          <div style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
            No playlist selected
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {current && (
          <div style={{ flex:1, fontSize:11, fontFamily:"'DM Mono',monospace",
            color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {current.source} {current.name}
          </div>
        )}
        <button onClick={() => { setShowList(v => !v); setShowAdd(false) }}
          style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:7,
            color:'var(--text2)', fontSize:11, fontFamily:"'DM Mono',monospace",
            padding:'5px 10px', cursor:'pointer', whiteSpace:'nowrap' }}>
          {showList ? '✕ Close' : `📋 Playlists (${playlists.length})`}
        </button>
        <button onClick={() => { setShowAdd(v => !v); setShowList(false) }}
          style={{ background:'var(--accent)', border:'none', borderRadius:7,
            color:'#fff', fontSize:11, fontWeight:700, padding:'5px 10px', cursor:'pointer' }}>
          + Add
        </button>
      </div>

      {/* Saved playlists list */}
      {showList && (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          {playlists.length === 0 && (
            <div style={{ padding:'12px 14px', fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
              No saved playlists yet. Click + Add to save one.
            </div>
          )}
          {playlists.map(pl => (
            <div key={pl.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              borderBottom:'1px solid var(--border)',
              background: current?.id === pl.id ? 'rgba(91,127,255,.1)' : 'transparent' }}>
              <span style={{ fontSize:13 }}>{pl.source?.split(' ')[0] || '🎵'}</span>
              <span style={{ flex:1, fontSize:12, fontWeight: current?.id === pl.id ? 700 : 400,
                color: current?.id === pl.id ? 'var(--accent2)' : 'var(--text)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                cursor:'pointer' }}
                onClick={() => play(pl)}>
                {pl.name}
              </span>
              {current?.id !== pl.id && (
                <button onClick={() => play(pl)}
                  style={{ background:'var(--accent)', border:'none', borderRadius:5, color:'#fff',
                    fontSize:10, padding:'3px 8px', cursor:'pointer' }}>▶ Play</button>
              )}
              {current?.id === pl.id && (
                <span style={{ fontSize:9, color:'var(--accent2)', fontFamily:"'DM Mono',monospace" }}>● Now</span>
              )}
              <button onClick={() => removePl(pl.id)}
                style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer',
                  fontSize:13, padding:'0 2px' }}
                onMouseEnter={e => e.target.style.color='var(--red)'}
                onMouseLeave={e => e.target.style.color='var(--text3)'}>×</button>
            </div>
          ))}

          {/* Presets section */}
          <div style={{ padding:'8px 12px', borderTop:'1px solid var(--border)' }}>
            <div style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace",
              textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Spotify Presets</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {PRESETS.map(p => (
                <div key={p.url} onClick={() => applyPreset(p)}
                  style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:20,
                    padding:'3px 10px', fontSize:10, fontFamily:"'DM Mono',monospace",
                    color:'var(--text2)', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border2)'}>
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add playlist form */}
      {showAdd && (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, padding:12 }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Save Playlist</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Name (e.g. My Beatles Mix)"
              style={{ ...iStyle }} maxLength={50} />
            <input value={newUrl} onChange={e => { setNewUrl(e.target.value); setNameError('') }}
              onKeyDown={e => e.key === 'Enter' && saveAndPlay()}
              placeholder="Spotify or YouTube URL"
              style={{ ...iStyle }} />
            {nameError && <div style={{ fontSize:10, color:'var(--red)', fontFamily:"'DM Mono',monospace" }}>{nameError}</div>}
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={saveAndPlay}
                style={{ flex:1, background:'var(--accent)', border:'none', borderRadius:7,
                  color:'#fff', fontSize:12, fontWeight:700, padding:'7px', cursor:'pointer' }}>
                💾 Save & Play
              </button>
              <button onClick={() => { setShowAdd(false); setNameError('') }}
                style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:7,
                  color:'var(--text2)', fontSize:12, padding:'7px 12px', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

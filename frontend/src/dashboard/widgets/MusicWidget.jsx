import { useState } from 'react'
import { setPlaying } from './musicPlayer'

const PRESETS = [
  // Spotify
  { name:'Top 50 Global',       url:'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF', src:'Spotify' },
  { name:'Peaceful Piano',      url:'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO', src:'Spotify' },
  { name:'Jazz Vibes',          url:'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT', src:'Spotify' },
  { name:'80s Hits',            url:'https://open.spotify.com/playlist/37i9dQZF1DX4UtSsGT1Sbe', src:'Spotify' },
  { name:'70s Classics',        url:'https://open.spotify.com/playlist/37i9dQZF1DWTJ7xPn4vNaz', src:'Spotify' },
  { name:'90s Hits',            url:'https://open.spotify.com/playlist/37i9dQZF1DXbTxeAdrVG2l', src:'Spotify' },
  { name:'Rock Classics',       url:'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U', src:'Spotify' },
  { name:'Deep Focus',          url:'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', src:'Spotify' },
  { name:'Soft Jazz',           url:'https://open.spotify.com/playlist/37i9dQZF1DXdwTUxmGKrdN', src:'Spotify' },
  { name:'Classical Essentials',url:'https://open.spotify.com/playlist/37i9dQZF1DWWEJlAGA9gs0', src:'Spotify' },
  { name:'Latin Pop',           url:'https://open.spotify.com/playlist/37i9dQZF1DX10zKzsJ2jva', src:'Spotify' },
  { name:'Chill Hits',          url:'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6', src:'Spotify' },
  // SoundCloud — verified ✅
  { name:'80s Greatest Hits',   url:'https://soundcloud.com/80s-hits-music/sets/80s-hits-music',           src:'SoundCloud' },
  { name:'80s Pop Hits',        url:'https://soundcloud.com/80shitsmusic/sets/80s-pop-hits',               src:'SoundCloud' },
  { name:'Best of 80s',         url:'https://soundcloud.com/bestof80s/sets/80s-greatest-hits',             src:'SoundCloud' },
  { name:'70s Greatest Hits',   url:'https://soundcloud.com/70shits/sets/70s-greatest-hits',               src:'SoundCloud' },
  { name:'Beatles Greatest',    url:'https://soundcloud.com/beatles-songs/sets/beatles-greatest-hits',     src:'SoundCloud' },
  { name:'Classic Rock',        url:'https://soundcloud.com/alternativerock4ever/sets/classic-rock',       src:'SoundCloud' },
  // Mixcloud — paste any URL from mixcloud.com to add your own
]

function toEmbedUrl(url) {
  try {
    if (url.includes('spotify.com')) {
      const parts = new URL(url).pathname.split('/').filter(Boolean)
      if (parts.length >= 2) return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator&theme=0`
    }
    if (url.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%235b7fff&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`
    }
    if (url.includes('mixcloud.com')) {
      const path = new URL(url).pathname
      return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=${encodeURIComponent(path)}`
    }
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return null
  } catch { return null }
}

function getSource(url) {
  if (url.includes('spotify.com'))    return { label: 'Spotify',      icon: '🟢' }
  if (url.includes('soundcloud.com')) return { label: 'SoundCloud',   icon: '🟠' }
  if (url.includes('mixcloud.com'))   return { label: 'Mixcloud',     icon: '🟣' }
  if (url.includes('drive.google'))   return { label: 'Google Drive', icon: '🔵' }
  return { label: 'Music', icon: '🎵' }
}

function iframeHeight(source) {
  if (!source) return 380
  const l = source.label
  if (l === 'Spotify')      return 380
  if (l === 'SoundCloud')   return 300
  if (l === 'Mixcloud')     return 180
  if (l === 'Google Drive') return 200
  return 380
}

const SOURCES = ['Spotify', 'SoundCloud', 'Mixcloud', 'Google Drive']

export default function MusicWidget({ config, onUpdate }) {
  const playlists = config.playlists || []
  const current   = config.current   || null

  const [showAdd,    setShowAdd]    = useState(false)
  const [showList,   setShowList]   = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newUrl,     setNewUrl]     = useState('')
  const [urlError,   setUrlError]   = useState('')
  const [detectedSrc, setDetectedSrc] = useState(null)

  function play(pl) {
    onUpdate({ current: pl })
    setPlaying(pl)
    setShowList(false)
  }

  function saveAndPlay() {
    const name    = newName.trim() || 'My Playlist'
    const url     = newUrl.trim()
    if (!url) return
    const embedUrl = toEmbedUrl(url)
    if (!embedUrl) { setUrlError('Invalid URL — paste a Spotify, SoundCloud, Mixcloud, or Google Drive link'); return }
    const source = getSource(url)
    const pl = { id: 'pl_' + Date.now(), name, url, embedUrl, source }
    const updated = [...playlists, pl]
    onUpdate({ playlists: updated, current: pl })
    setPlaying(pl)
    setNewName(''); setNewUrl(''); setUrlError(''); setDetectedSrc(null); setShowAdd(false)
  }

  function applyPreset(p) {
    const embedUrl = toEmbedUrl(p.url)
    if (!embedUrl) return
    const source = getSource(p.url)
    const pl = { id: 'pl_' + Date.now(), name: p.name, url: p.url, embedUrl, source }
    const already = playlists.find(x => x.url === p.url)
    const updated  = already ? playlists : [...playlists, pl]
    onUpdate({ playlists: updated, current: already || pl })
    setPlaying(already || pl)
    setShowList(false)
  }

  function removePl(id) {
    const updated    = playlists.filter(p => p.id !== id)
    const newCurrent = current?.id === id ? (updated[0] || null) : current
    onUpdate({ playlists: updated, current: newCurrent })
    if (newCurrent) setPlaying(newCurrent)
  }

  function handleUrlChange(val) {
    setNewUrl(val)
    setUrlError('')
    if (val.trim()) {
      setDetectedSrc(getSource(val.trim()))
    } else {
      setDetectedSrc(null)
    }
  }

  const isDrive = newUrl.includes('drive.google')

  const iStyle = {
    flex: 1, background: 'var(--s3)', border: '1px solid var(--border2)', borderRadius: 7,
    color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 11,
    padding: '6px 10px', outline: 'none', width: '100%',
  }

  const height = iframeHeight(current?.source)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Player */}
      {current?.embedUrl ? (
        <iframe
          src={current.embedUrl}
          width="100%"
          height={height}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ borderRadius: 12, border: 'none', display: 'block' }}
        />
      ) : (
        <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', background: 'var(--s2)', borderRadius: 12,
          border: '1px solid var(--border)', gap: 8 }}>
          <div style={{ fontSize: 32 }}>🎵</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
            No playlist selected
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {current && (
          <div style={{ flex: 1, fontSize: 11, fontFamily: "'DM Mono',monospace",
            color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {current.source?.icon} {current.source?.label} · {current.name}
          </div>
        )}
        <button
          onClick={() => { setShowList(v => !v); setShowAdd(false) }}
          style={{ background: 'var(--s3)', border: '1px solid var(--border2)', borderRadius: 7,
            color: 'var(--text2)', fontSize: 11, fontFamily: "'DM Mono',monospace",
            padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {showList ? '✕ Close' : `📋 Playlists (${playlists.length})`}
        </button>
        <button
          onClick={() => { setShowAdd(v => !v); setShowList(false) }}
          style={{ background: 'var(--accent)', border: 'none', borderRadius: 7,
            color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', cursor: 'pointer' }}>
          + Add
        </button>
      </div>

      {/* Playlists panel */}
      {showList && (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {playlists.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
              No saved playlists yet. Click + Add to save one.
            </div>
          )}
          {playlists.map(pl => (
            <div key={pl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderBottom: '1px solid var(--border)',
              background: current?.id === pl.id ? 'rgba(91,127,255,.1)' : 'transparent' }}>
              <span style={{ fontSize: 13 }}>{pl.source?.icon || '🎵'}</span>
              <span
                style={{ flex: 1, fontSize: 12, fontWeight: current?.id === pl.id ? 700 : 400,
                  color: current?.id === pl.id ? 'var(--accent2)' : 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                onClick={() => play(pl)}>
                {pl.name}
              </span>
              {current?.id !== pl.id && (
                <button onClick={() => play(pl)}
                  style={{ background: 'var(--accent)', border: 'none', borderRadius: 5, color: '#fff',
                    fontSize: 10, padding: '3px 8px', cursor: 'pointer' }}>▶ Play</button>
              )}
              {current?.id === pl.id && (
                <span style={{ fontSize: 9, color: 'var(--accent2)', fontFamily: "'DM Mono',monospace" }}>● Now</span>
              )}
              <button onClick={() => removePl(pl.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                  fontSize: 13, padding: '0 2px' }}
                onMouseEnter={e => e.target.style.color = 'var(--red)'}
                onMouseLeave={e => e.target.style.color = 'var(--text3)'}>×</button>
            </div>
          ))}

          {/* Presets grouped by source */}
          {SOURCES.map(srcName => {
            const group = PRESETS.filter(p => p.src === srcName)
            if (!group.length) return null
            const srcInfo = getSource(group[0].url)
            return (
              <div key={srcName} style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: "'DM Mono',monospace",
                  textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                  {srcInfo.icon} {srcName} Presets
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {group.map(p => (
                    <div key={p.url} onClick={() => applyPreset(p)}
                      style={{ background: 'var(--s3)', border: '1px solid var(--border2)', borderRadius: 20,
                        padding: '3px 10px', fontSize: 10, fontFamily: "'DM Mono',monospace",
                        color: 'var(--text2)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Save Playlist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Name (e.g. My Chill Mix)"
              style={{ ...iStyle }} maxLength={50} />
            <input value={newUrl} onChange={e => handleUrlChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveAndPlay()}
              placeholder="Spotify, SoundCloud, Mixcloud, or Google Drive URL"
              style={{ ...iStyle }} />
            {detectedSrc && (
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                {detectedSrc.icon} Detected: {detectedSrc.label}
                {isDrive && (
                  <span style={{ marginLeft: 8, color: 'var(--yellow)' }}>
                    · Share file as "Anyone with link"
                  </span>
                )}
              </div>
            )}
            {urlError && <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{urlError}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveAndPlay}
                style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 7,
                  color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px', cursor: 'pointer' }}>
                💾 Save & Play
              </button>
              <button onClick={() => { setShowAdd(false); setUrlError(''); setDetectedSrc(null); setNewUrl(''); setNewName('') }}
                style={{ background: 'var(--s3)', border: '1px solid var(--border2)', borderRadius: 7,
                  color: 'var(--text2)', fontSize: 12, padding: '7px 12px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

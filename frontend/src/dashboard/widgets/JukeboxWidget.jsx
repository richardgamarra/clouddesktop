import { useState, useEffect, useRef } from 'react'

export default function JukeboxWidget() {
  const [songs, setSongs]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [current, setCurrent]   = useState(null)
  const [playing, setPlaying]   = useState(false)
  const [embedBlocked, setEmbedBlocked] = useState(false)
  const [search, setSearch]     = useState('')
  const iframeRef = useRef(null)
  const currentIdx = songs.findIndex(s => s.id === current?.id)

  useEffect(() => {
    fetch('/api/jukebox/songs')
      .then(r => r.json())
      .then(d => { setSongs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Could not load jukebox'); setLoading(false) })
  }, [])

  function play(song) {
    setCurrent(song)
    setPlaying(true)
    setEmbedBlocked(false)
  }

  function playNext() {
    if (currentIdx < songs.length - 1) play(filteredSongs[filteredSongs.findIndex(s => s.id === current?.id) + 1])
  }

  function playPrev() {
    const fi = filteredSongs.findIndex(s => s.id === current?.id)
    if (fi > 0) play(filteredSongs[fi - 1])
  }

  const filteredSongs = songs.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  )

  const embedUrl = current
    ? `${current.embed_src}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`
    : null

  const WIDGET_H = 500

  return (
    <div style={{ display:'flex', height:WIDGET_H, gap:0, overflow:'hidden', margin:'-16px', borderRadius:'0 0 12px 12px' }}>

      {/* LEFT — Playlist */}
      <div style={{ width:'42%', display:'flex', flexDirection:'column', borderRight:'1px solid var(--border)', minWidth:0, height:WIDGET_H }}>
        {/* Search */}
        <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search…"
            style={{ width:'100%', background:'var(--s3)', border:'1px solid var(--border2)',
              borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace",
              fontSize:11, padding:'5px 8px', outline:'none', boxSizing:'border-box' }} />
        </div>

        {/* Song list — scrollable */}
        <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent', height:0 }}>
          {loading && <div style={{ padding:16, color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:11 }}>Loading…</div>}
          {error   && <div style={{ padding:16, color:'var(--red)', fontFamily:"'DM Mono',monospace", fontSize:11 }}>{error}</div>}
          {filteredSongs.map((song, i) => {
            const isActive = current?.id === song.id
            return (
              <div key={song.id} onClick={() => play(song)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                  background: isActive ? 'rgba(91,127,255,.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  cursor:'pointer', transition:'background .1s', borderBottom:'1px solid var(--border)' }}
                onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='var(--s3)' }}
                onMouseLeave={e => { if(!isActive) e.currentTarget.style.background='transparent' }}>
                {/* Thumbnail */}
                {song.thumb ? (
                  <img src={song.thumb} alt="" width={40} height={28}
                    style={{ borderRadius:4, objectFit:'cover', flexShrink:0 }} />
                ) : (
                  <div style={{ width:40, height:28, borderRadius:4, background:'var(--s4)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, flexShrink:0 }}>🎵</div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight: isActive ? 700 : 400,
                    color: isActive ? 'var(--accent2)' : 'var(--text)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {isActive && playing ? '▶ ' : ''}{song.name}
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && filteredSongs.length === 0 && (
            <div style={{ padding:16, color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:11 }}>
              No songs found
            </div>
          )}
        </div>

        {/* Count */}
        <div style={{ padding:'4px 10px', borderTop:'1px solid var(--border)', flexShrink:0,
          fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
          {filteredSongs.length} of {songs.length} songs
        </div>
      </div>

      {/* RIGHT — Player */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, height:WIDGET_H }}>
        {current ? (
          <>
            {/* Video */}
            <div style={{ flex:1, background:'#000', position:'relative', overflow:'hidden', height:0 }}>
              {!embedBlocked ? (
                <iframe
                  ref={iframeRef}
                  key={current.id}
                  src={embedUrl}
                  width="100%" height="100%"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ display:'block', border:'none', position:'absolute', inset:0 }}
                  onLoad={() => {
                    // Detect Error 153 by checking if iframe content changed after 2s
                    setTimeout(() => {
                      try {
                        const doc = iframeRef.current?.contentDocument
                        if (!doc || doc.title?.includes('Error') || doc.body?.innerText?.includes('153')) {
                          setEmbedBlocked(true)
                        }
                      } catch {} // cross-origin, can't read — assume ok
                    }, 2500)
                  }}
                />
              ) : null}

              {/* Fallback overlay — shown when embedding blocked OR as default */}
              {(embedBlocked) && (
                <div style={{ position:'absolute', inset:0, background:'#111',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
                  {current.thumb && (
                    <img src={current.thumb} alt="" style={{ width:200, borderRadius:8, opacity:.9 }} />
                  )}
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff', textAlign:'center' }}>{current.name}</div>
                  <div style={{ fontSize:11, color:'#aaa', fontFamily:"'DM Mono',monospace", textAlign:'center' }}>
                    ⚠ YouTube blocks embedding for this video
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => window.open(current.url, '_blank')}
                      style={{ background:'#ff0000', border:'none', borderRadius:8, color:'#fff',
                        fontSize:13, fontWeight:700, padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                      ▶ Watch on YouTube
                    </button>
                    <button onClick={() => setEmbedBlocked(false)}
                      style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:8,
                        color:'var(--text2)', fontSize:11, padding:'10px 14px', cursor:'pointer' }}>
                      Try embed
                    </button>
                  </div>
                </div>
              )}

              {/* Auto-detect button for first try */}
              {!embedBlocked && (
                <button onClick={() => setEmbedBlocked(true)}
                  style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,.6)',
                    border:'none', borderRadius:4, color:'#aaa', fontSize:9, padding:'3px 7px',
                    cursor:'pointer', fontFamily:"'DM Mono',monospace", zIndex:10 }}>
                  Error 153? Click here
                </button>
              )}
            </div>

            {/* Controls */}
            <div style={{ padding:'10px 14px', background:'var(--s2)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>
                {current.name}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}>
                <button onClick={playPrev}
                  disabled={filteredSongs.findIndex(s => s.id === current.id) <= 0}
                  style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6,
                    color:'var(--text2)', fontSize:14, padding:'5px 12px', cursor:'pointer',
                    opacity: filteredSongs.findIndex(s => s.id === current.id) <= 0 ? .3 : 1 }}>
                  ⏮
                </button>
                <button onClick={playNext}
                  disabled={filteredSongs.findIndex(s => s.id === current.id) >= filteredSongs.length - 1}
                  style={{ background:'var(--accent)', border:'none', borderRadius:6,
                    color:'#fff', fontSize:14, padding:'5px 16px', cursor:'pointer',
                    opacity: filteredSongs.findIndex(s => s.id === current.id) >= filteredSongs.length - 1 ? .3 : 1 }}>
                  ⏭ Next
                </button>
                <button onClick={() => window.open(current.url, '_blank')}
                  style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6,
                    color:'var(--text3)', fontSize:11, padding:'5px 10px', cursor:'pointer',
                    fontFamily:"'DM Mono',monospace" }}>
                  ↗ YT
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:12, color:'var(--text3)', height:0 }}>
            <div style={{ fontSize:48 }}>🎬</div>
            <div style={{ fontSize:13, fontFamily:"'DM Mono',monospace" }}>
              {loading ? 'Loading jukebox…' : '← Select a song to play'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'

const YT_KEY = 'AIzaSyCmUR528jgG2q_NNyW0GdDcA9FuhDIOE68'

// Load YouTube IFrame API once globally
function loadYTApi() {
  if (window.YT && window.YT.Player) return Promise.resolve()
  if (window._ytApiPromise) return window._ytApiPromise
  window._ytApiPromise = new Promise(resolve => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve()
  })
  return window._ytApiPromise
}

export default function YouTubeWidget({ config, onUpdate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIdx, setActiveIdx] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playerReady, setPlayerReady] = useState(false)
  const playerRef = useRef(null)
  const playerDivId = useRef('yt-player-' + Math.random().toString(36).slice(2))
  const activeIdxRef = useRef(null)
  const resultsRef = useRef([])

  // Keep refs in sync
  useEffect(() => { activeIdxRef.current = activeIdx }, [activeIdx])
  useEffect(() => { resultsRef.current = results }, [results])

  const playIdx = useCallback((idx) => {
    const list = resultsRef.current
    if (!list.length || idx == null) return
    const videoId = list[idx]?.id?.videoId
    if (!videoId) return
    setActiveIdx(idx)
    if (playerRef.current && playerReady) {
      playerRef.current.loadVideoById(videoId)
    }
  }, [playerReady])

  // Init player once
  useEffect(() => {
    let destroyed = false
    loadYTApi().then(() => {
      if (destroyed) return
      playerRef.current = new window.YT.Player(playerDivId.current, {
        height: '185',
        width: '100%',
        videoId: '',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { if (!destroyed) setPlayerReady(true) },
          onError: (e) => {
            // 100=not found, 101/150/153=embedding disabled — auto skip
            if ([100, 101, 150, 153].includes(e.data)) {
              const next = (activeIdxRef.current ?? -1) + 1
              if (next < resultsRef.current.length) {
                setActiveIdx(next)
                resultsRef.current[next] && playerRef.current?.loadVideoById(resultsRef.current[next].id.videoId)
              }
            }
          },
          onStateChange: (e) => {
            // Auto-advance when video ends (state 0)
            if (e.data === 0) {
              const next = (activeIdxRef.current ?? -1) + 1
              if (next < resultsRef.current.length) {
                setActiveIdx(next)
                playerRef.current?.loadVideoById(resultsRef.current[next].id.videoId)
              }
            }
          },
        },
      })
    })
    return () => {
      destroyed = true
      try { playerRef.current?.destroy() } catch {}
      playerRef.current = null
    }
  }, [])

  async function search(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    setActiveIdx(null)
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${YT_KEY}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Search failed')
      const items = data.items || []
      if (!items.length) { setError('No results found.'); return }
      resultsRef.current = items
      setResults(items)
      // Auto-play first result
      setActiveIdx(0)
      if (playerRef.current && playerReady) {
        playerRef.current.loadVideoById(items[0].id.videoId)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function playNext() {
    const next = ((activeIdxRef.current ?? -1) + 1) % resultsRef.current.length
    playIdx(next)
  }

  function playPrev() {
    const prev = ((activeIdxRef.current ?? 0) - 1 + resultsRef.current.length) % resultsRef.current.length
    playIdx(prev)
  }

  const activeTitle = results[activeIdx]?.snippet?.title || ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search */}
      <form onSubmit={search} style={{ display: 'flex', gap: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search song or artist…"
          style={{ flex: 1, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text1)', fontSize: 13, fontFamily: "'DM Mono',monospace", outline: 'none' }}
        />
        <button type="submit" disabled={loading}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          {loading ? '…' : '🔍'}
        </button>
      </form>

      {/* Player — always mounted, hidden until results */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border2)', background: '#000', display: results.length ? 'block' : 'none' }}>
        <div id={playerDivId.current} style={{ width: '100%', height: 185 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--s2)' }}>
          <button onClick={playPrev} title="Previous" style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>⏮</button>
          <button onClick={playNext} title="Next" style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>⏭</button>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTitle}</span>
        </div>
      </div>

      {error && <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{error}</div>}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
          {results.map((item, idx) => {
            const isActive = idx === activeIdx
            return (
              <div key={item.id.videoId} onClick={() => playIdx(idx)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', background: isActive ? 'rgba(91,127,255,.15)' : 'var(--s3)', border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`, transition: 'all .15s' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--s2)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--s3)' }}>
                <img src={item.snippet.thumbnails?.default?.url} alt="" style={{ width: 48, height: 34, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--accent)' : 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isActive && '▶ '}{item.snippet.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>{item.snippet.channelTitle}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!results.length && !loading && !error && (
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", textAlign: 'center', paddingTop: 8 }}>
          Search for a song or artist to start listening
        </div>
      )}
    </div>
  )
}

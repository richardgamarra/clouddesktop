import { useState, useRef, useEffect } from 'react'

const YT_KEY = 'AIzaSyCmUR528jgG2q_NNyW0GdDcA9FuhDIOE68'

export default function YouTubeWidget() {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [activeIdx, setActiveIdx] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [shuffle, setShuffle]     = useState(false)

  const iframeRef    = useRef(null)
  const resultsRef   = useRef([])
  const activeIdxRef = useRef(null)
  const shuffleRef   = useRef(false)

  useEffect(() => { resultsRef.current = results }, [results])
  useEffect(() => { activeIdxRef.current = activeIdx }, [activeIdx])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])

  // postMessage listener — auto-continue on end (state 0), skip on error
  useEffect(() => {
    function onMessage(e) {
      if (!e.data) return
      let data
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch { return }

      // Video ended (state 0) → auto-advance
      if (data.event === 'onStateChange' && data.info === 0) {
        advance()
        return
      }

      // Embedding errors → skip to next
      const code = data.info ?? data.info?.error
      if (data.event === 'onError' && [100, 101, 150, 153].includes(code)) {
        advance()
        return
      }
      if (data.event === 'infoDelivery' && data.info?.error) {
        advance()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function buildSrc(videoId) {
    const origin = encodeURIComponent(location.origin)
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&origin=${origin}`
  }

  function loadVideo(idx) {
    const list = resultsRef.current
    if (!list[idx]) return
    setActiveIdx(idx)
    if (iframeRef.current) iframeRef.current.src = buildSrc(list[idx].id.videoId)
  }

  function advance() {
    const list = resultsRef.current
    if (!list.length) return
    const cur = activeIdxRef.current ?? -1
    let next
    if (shuffleRef.current) {
      // Pick a random index different from current
      let r
      do { r = Math.floor(Math.random() * list.length) } while (list.length > 1 && r === cur)
      next = r
    } else {
      next = (cur + 1) % list.length
    }
    loadVideo(next)
  }

  function openOnYouTube(idx) {
    const item = resultsRef.current[idx ?? activeIdxRef.current]
    if (item) window.open(`https://www.youtube.com/watch?v=${item.id.videoId}`, '_blank')
  }

  async function search(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    setActiveIdx(null)
    if (iframeRef.current) iframeRef.current.src = ''
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${YT_KEY}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Search failed')
      const items = data.items || []
      if (!items.length) { setError('No results found.'); return }
      resultsRef.current = items
      setResults(items)
      setTimeout(() => loadVideo(0), 50)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const activeTitle = results[activeIdx]?.snippet?.title || ''

  const btnBase = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search bar */}
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

      {/* Player */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border2)', background: '#000', display: results.length ? 'block' : 'none' }}>
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
          title="YouTube Music"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'var(--s2)' }}>
          <button onClick={() => loadVideo(Math.max(0, (activeIdxRef.current ?? 1) - 1))} title="Previous" style={{ ...btnBase, color: 'var(--text2)' }}>⏮</button>
          <button onClick={advance} title="Next" style={{ ...btnBase, color: 'var(--text2)' }}>⏭</button>
          <button
            onClick={() => setShuffle(s => !s)}
            title={shuffle ? 'Shuffle on — click to turn off' : 'Shuffle off — click to turn on'}
            style={{ ...btnBase, fontSize: 14, color: shuffle ? 'var(--accent)' : 'var(--text3)', fontWeight: shuffle ? 700 : 400 }}>
            🔀
          </button>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 4 }}>{activeTitle}</span>
          <button onClick={() => openOnYouTube(activeIdx)} title="Open on YouTube"
            style={{ ...btnBase, fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', fontFamily: "'DM Mono',monospace" }}>▶ YT</button>
        </div>
      </div>

      {error && <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{error}</div>}

      {/* Results list */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
          {results.map((item, idx) => {
            const isActive = idx === activeIdx
            return (
              <div key={item.id.videoId}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: isActive ? 'rgba(91,127,255,.15)' : 'var(--s3)', border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`, transition: 'all .15s' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--s2)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--s3)' }}>
                <img src={item.snippet.thumbnails?.default?.url} alt="" onClick={() => loadVideo(idx)}
                  style={{ width: 48, height: 34, objectFit: 'cover', borderRadius: 4, flexShrink: 0, cursor: 'pointer' }} />
                <div style={{ overflow: 'hidden', flex: 1, cursor: 'pointer' }} onClick={() => loadVideo(idx)}>
                  <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--accent)' : 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isActive && '▶ '}{item.snippet.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>{item.snippet.channelTitle}</div>
                </div>
                <a href={`https://www.youtube.com/watch?v=${item.id.videoId}`} target="_blank" rel="noopener noreferrer"
                  title="Open on YouTube" onClick={e => e.stopPropagation()}
                  style={{ flexShrink: 0, fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", textDecoration: 'none', padding: '2px 6px' }}>▶YT</a>
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

import { useState, useRef, useEffect } from 'react'

const YT_KEY = 'AIzaSyCmUR528jgG2q_NNyW0GdDcA9FuhDIOE68'

export default function YouTubeWidget() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activeTitle, setActiveTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeIdx, setActiveIdx] = useState(null)
  const inputRef = useRef(null)

  async function search(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&videoEmbeddable=true&maxResults=12&q=${encodeURIComponent(query)}&key=${YT_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Search failed')
      setResults(data.items || [])
      if (!data.items?.length) setError('No results found.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function play(item, idx) {
    setActiveId(item.id.videoId)
    setActiveTitle(item.snippet.title)
    setActiveIdx(idx)
  }

  function playNext() {
    if (activeIdx === null || !results.length) return
    const next = (activeIdx + 1) % results.length
    play(results[next], next)
  }

  function playPrev() {
    if (activeIdx === null || !results.length) return
    const prev = (activeIdx - 1 + results.length) % results.length
    play(results[prev], prev)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search bar */}
      <form onSubmit={search} style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search song or artist…"
          style={{
            flex: 1, background: 'var(--s3)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 12px', color: 'var(--text1)', fontSize: 13,
            fontFamily: "'DM Mono',monospace", outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {loading ? '…' : '🔍'}
        </button>
      </form>

      {/* Player */}
      {activeId && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border2)', background: '#000' }}>
          <iframe
            key={activeId}
            src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0`}
            width="100%"
            height="185"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ display: 'block' }}
            title={activeTitle}
          />
          {/* Player controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--s2)' }}>
            <button onClick={playPrev} title="Previous" style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>⏮</button>
            <button onClick={playNext} title="Next" style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>⏭</button>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTitle}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{error}</div>}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
          {results.map((item, idx) => {
            const isActive = item.id.videoId === activeId
            return (
              <div
                key={item.id.videoId}
                onClick={() => play(item, idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                  borderRadius: 8, cursor: 'pointer',
                  background: isActive ? 'rgba(91,127,255,.15)' : 'var(--s3)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--s2)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--s3)' }}
              >
                <img
                  src={item.snippet.thumbnails?.default?.url}
                  alt=""
                  style={{ width: 48, height: 34, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                />
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

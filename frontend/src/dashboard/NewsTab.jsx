import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_NEWS_SOURCES, CATEGORY_COLORS } from './constants'
import SourceModal from './SourceModal'
import ConfirmModal from '../components/ConfirmModal'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function stripTags(s) { return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
function decodeEntities(s) { const t = document.createElement('textarea'); t.innerHTML = s; return t.value }
function extractImg(html) { const m = html.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i); return m ? m[1] : '' }
function formatAge(dateStr) {
  try {
    const d = new Date(dateStr); if (isNaN(d)) return ''
    const m = Math.round((Date.now() - d.getTime()) / 60000)
    if (m < 2) return 'just now'; if (m < 60) return `${m}m ago`
    const h = Math.round(m / 60); if (h < 24) return `${h}h ago`
    return `${Math.round(h / 24)}d ago`
  } catch { return '' }
}

function parseRSSXML(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const isAtom = !!doc.querySelector('feed')
  const items = [...doc.querySelectorAll(isAtom ? 'entry' : 'item')]
  return items.slice(0, 5).map(item => {
    const txt = sel => item.querySelector(sel)?.textContent?.trim() || ''
    const attr = (sel, a) => item.querySelector(sel)?.getAttribute(a) || ''
    const rawDesc = item.querySelector('description')?.textContent || txt('summary') || txt('content')
    return {
      title: decodeEntities(txt('title')),
      link: attr('link', 'href') || txt('link') || txt('guid') || '',
      desc: decodeEntities(stripTags(rawDesc)).slice(0, 220),
      image: attr('enclosure[type^="image"]', 'url') || attr('thumbnail', 'url') || extractImg(rawDesc) || '',
      pubDate: txt('pubDate') || txt('published') || '',
      category: txt('category'),
    }
  }).filter(i => i.title && i.link)
}

async function fetchRSS(src) {
  // Strategy 1: Our own backend proxy (no CORS, most reliable)
  try {
    const r = await fetch(`/api/news/fetch?url=${encodeURIComponent(src.url)}`, { signal: AbortSignal.timeout(10000) })
    if (r.ok) {
      const d = await r.json()
      if (Array.isArray(d.items) && d.items.length) return d.items
    }
  } catch {}

  // Strategy 2: rss2json fallback
  const rss2json = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}&count=5`
  try {
    const r = await fetch(rss2json, { signal: AbortSignal.timeout(8000) })
    if (r.ok) {
      const d = await r.json()
      if (d.status === 'ok' && Array.isArray(d.items) && d.items.length) {
        return d.items.slice(0, 5).map(it => ({
          title: decodeEntities(stripTags(it.title || '')),
          link: it.link || it.guid || '',
          desc: decodeEntities(stripTags(it.description || it.content || '')).slice(0, 220),
          image: it.enclosure?.link || it.thumbnail || extractImg(it.description || '') || '',
          pubDate: it.pubDate || '',
          category: Array.isArray(it.categories) ? it.categories[0] || '' : '',
        })).filter(i => i.title && i.link)
      }
    }
  } catch {}
  try {
    const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(src.url)}&timestamp=${Date.now()}`, { signal: AbortSignal.timeout(9000) })
    if (r.ok) { const d = await r.json(); if (d?.contents?.length > 300) return parseRSSXML(d.contents) }
  } catch {}
  try {
    const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(src.url)}`, { signal: AbortSignal.timeout(9000) })
    if (r.ok) { const t = await r.text(); if (t.length > 300) return parseRSSXML(t) }
  } catch {}
  throw new Error('All fetch strategies failed')
}

function NewsCard({ item, src }) {
  const showImg = src.showImages !== false
  return (
    <a className="news-card" href={item.link} target="_blank" rel="noopener noreferrer">
      {showImg && (
        <div className="news-card-img">
          {item.image
            ? <img src={item.image} alt="" loading="lazy" onError={e => { e.target.parentNode.innerHTML = '<div class="img-placeholder"><span>No image</span></div>' }} />
            : <div className="img-placeholder"><span>No image</span></div>
          }
        </div>
      )}
      <div className="news-card-body">
        {item.category && <div className="news-card-category">{item.category}</div>}
        <div className="news-card-title">{item.title}</div>
        {item.desc && <div className="news-card-desc">{item.desc}</div>}
        <div className="news-card-meta">
          {item.pubDate && <span>{formatAge(item.pubDate)}</span>}
          <span className="news-card-source-tag" style={{ color: src.color }}>{src.name}</span>
        </div>
      </div>
    </a>
  )
}

function SkeletonCard({ isHero }) {
  return (
    <div className={`news-card${isHero ? ' hero' : ''}`} style={{ cursor:'default' }}>
      <div className="news-card-img skeleton" />
      <div className="news-card-body" style={{ gap:7 }}>
        <div className="skeleton" style={{ height:10, width:'60%', borderRadius:4 }} />
        <div className="skeleton" style={{ height:13, width:'90%', borderRadius:4 }} />
        <div className="skeleton" style={{ height:13, width:'75%', borderRadius:4 }} />
      </div>
    </div>
  )
}

// ── Compact view: hero card + text-only rows ──────────────────────────────────
function CompactSource({ src, items }) {
  if (!Array.isArray(items)) return null
  const [hero, ...rest] = items
  const showImg = src.showImages !== false
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, background:'var(--bg)' }}>
      {/* Hero: first article with image */}
      {hero && (
        <a href={hero.link} target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', textDecoration:'none', alignItems:'flex-start' }}
          onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
          onMouseLeave={e => e.currentTarget.style.background='var(--bg)'}>
          {showImg && hero.image && (
            <img src={hero.image} alt="" loading="lazy"
              style={{ width:80, height:54, objectFit:'cover', borderRadius:6, flexShrink:0 }}
              onError={e => { e.target.style.display='none' }} />
          )}
          {showImg && !hero.image && (
            <div style={{ width:80, height:54, borderRadius:6, background:'var(--s3)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📰</div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{hero.title}</div>
            {hero.desc && <div style={{ fontSize:11, color:'#ffffff', fontFamily:"'DM Mono',monospace", lineHeight:1.4, marginTop:3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{hero.desc}</div>}
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:4 }}>{formatAge(hero.pubDate)}</div>
          </div>
        </a>
      )}
      {/* Rest: text-only rows */}
      {rest.map((item, i) => (
        <a key={item.link + i} href={item.link} target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'baseline', gap:8, padding:'6px 0', borderBottom: i < rest.length-1 ? '1px solid var(--border)' : 'none', textDecoration:'none' }}
          onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
          onMouseLeave={e => e.currentTarget.style.background='var(--bg)'}>
          <span style={{ fontSize:10, color:'var(--accent)', flexShrink:0 }}>›</span>
          <span style={{ fontSize:12, color:'var(--text)', lineHeight:1.4, flex:1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.title}</span>
          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", flexShrink:0, whiteSpace:'nowrap' }}>{formatAge(item.pubDate)}</span>
        </a>
      ))}
    </div>
  )
}

export default function NewsTab({ sources, onSourcesChange, onAddSource }) {
  const [cache, setCache]       = useState({})
  const [filter, setFilter]     = useState('all')
  const [spinning, setSpinning] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Fetching latest headlines…')
  const [editSource, setEditSource] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null) // source id to remove
  const [newsView, setNewsView] = useState(() => localStorage.getItem('wsh_news_view') || 'grid')

  function toggleView(v) { setNewsView(v); localStorage.setItem('wsh_news_view', v) }

  const fetchAll = useCallback(async (force = false) => {
    setSpinning(true)
    setLastUpdated('Fetching headlines…')
    const newCache = force ? {} : {}
    await Promise.allSettled(
      sources.map(async src => {
        try { newCache[src.id] = await fetchRSS(src) }
        catch (e) { newCache[src.id] = { error: true, message: e.message } }
      })
    )
    setCache(prev => ({ ...prev, ...newCache }))
    const now = new Date()
    setLastUpdated(`Updated ${now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} — ${sources.length} source${sources.length !== 1 ? 's' : ''}`)
    setSpinning(false)
  }, [sources])

  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = filter === 'all' ? sources : sources.filter(s => s.id === filter)

  function removeSource(id) {
    onSourcesChange(sources.filter(s => s.id !== id))
    setCache(c => { const n = { ...c }; delete n[id]; return n })
    if (filter === id) setFilter('all')
    setConfirmRemove(null)
  }

  function handleEditSave(updated) {
    onSourcesChange(sources.map(s => s.id === updated.id ? updated : s))
    setEditSource(null)
  }

  function moveSource(id, dir) {
    const idx = sources.findIndex(s => s.id === id)
    if (idx < 0) return
    const next = idx + dir
    if (next < 0 || next >= sources.length) return
    const arr = [...sources]
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    onSourcesChange(arr)
  }

  return (
    <div id="news-panel">
      <div className="news-header">
        <div>
          <h1>📰 Today's News</h1>
          <p>{lastUpdated}</p>
        </div>
        <div className="news-header-right">
          {/* View toggle */}
          <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--border2)', flexShrink:0 }}>
            {[
              { v:'grid',    label:'▦', title:'Grid view' },
              { v:'compact', label:'≡', title:'Compact view' },
            ].map(({ v, label, title }) => (
              <button key={v} onClick={() => toggleView(v)} title={title}
                style={{ padding:'4px 10px', border:'none', cursor:'pointer', fontSize:13, fontFamily:"'DM Mono',monospace", fontWeight:700, background: newsView === v ? 'var(--accent)' : 'var(--s3)', color: newsView === v ? '#fff' : 'var(--text3)', transition:'background .15s' }}>
                {label}
              </button>
            ))}
          </div>
          <button className={`news-refresh-btn${spinning ? ' spinning' : ''}`} onClick={() => fetchAll(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 2v4H7"/><path d="M1 10V6h4"/><path d="M10.5 6A4.5 4.5 0 002.2 3.2"/><path d="M1.5 6a4.5 4.5 0 008.3 2.8"/>
            </svg>
            Refresh
          </button>
          <button className="news-add-source-btn" onClick={onAddSource}>+ Source</button>
        </div>
      </div>
      <div className="source-pills">
        <div className={`source-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          <span className="pill-dot" style={{ background:'var(--accent)' }} />All Sources
        </div>
        {sources.map(src => (
          <div key={src.id} className={`source-pill${filter === src.id ? ' active' : ''}`} onClick={() => setFilter(src.id)}>
            <span className="pill-dot" style={{ background: src.color }} />
            {src.name}
            <button className="pill-remove" onClick={e => { e.stopPropagation(); setConfirmRemove(src.id) }}>×</button>
          </div>
        ))}
      </div>
      <div className={newsView === 'compact' ? 'news-compact-grid' : ''}>
      {displayed.map(src => {
        const items = cache[src.id]
        const favicon = `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(tryHost(src.url))}`
        return (
          <div key={src.id} className="news-source-section">
            <div className="news-source-header">
              <div className="news-source-logo">
                <img src={favicon} alt="" onError={e => { e.target.outerHTML = '📰' }} />
              </div>
              <div>
                <div className="news-source-name" style={{ color: src.color }}>{src.name}</div>
                <div className="news-source-url">{tryHost(src.url)}</div>
              </div>
              <div className="news-source-spacer" />
              <div style={{ display:'flex', flexDirection:'column', gap:2, marginRight:6 }}>
                <button className="news-open-source-btn" style={{ padding:'1px 7px', fontSize:10, opacity: displayed.indexOf(src)===0 ? .3 : 1 }}
                  disabled={displayed.indexOf(src)===0}
                  onClick={() => moveSource(src.id, -1)}>▲</button>
                <button className="news-open-source-btn" style={{ padding:'1px 7px', fontSize:10, opacity: displayed.indexOf(src)===displayed.length-1 ? .3 : 1 }}
                  disabled={displayed.indexOf(src)===displayed.length-1}
                  onClick={() => moveSource(src.id, 1)}>▼</button>
              </div>
              <button className="news-open-source-btn" onClick={() => setEditSource(src)} style={{ marginRight: 6 }}>✎ Edit</button>
              <button className="news-open-source-btn" onClick={() => window.open(src.url.split('/rss')[0] || src.url, '_blank')}>Visit site ↗</button>
            </div>
            {newsView === 'grid' ? (
              <div className="news-cards-grid">
                {!items && [0,1,2,3,4].map(n => <SkeletonCard key={n} />)}
                {items?.error && (
                  <div className="news-error" style={{ gridColumn:'1/-1' }}>
                    ⚠ Could not fetch "{src.name}": {items.message}.{' '}
                    <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color:'var(--accent2)', marginLeft:6 }}>Try RSS directly ↗</a>
                  </div>
                )}
                {Array.isArray(items) && items.map((item, i) => (
                  <NewsCard key={item.link + i} item={item} src={src} />
                ))}
              </div>
            ) : (
              <div>
                {!items && <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'8px 0' }}>Loading…</div>}
                {items?.error && (
                  <div className="news-error">
                    ⚠ Could not fetch "{src.name}": {items.message}.
                  </div>
                )}
                {Array.isArray(items) && <CompactSource src={src} items={items} />}
              </div>
            )}
          </div>
        )
      })}

      </div>
      {editSource && (
        <SourceModal
          source={editSource}
          onSave={handleEditSave}
          onClose={() => setEditSource(null)}
        />
      )}

      {confirmRemove && (
        <ConfirmModal
          title="Remove News Source"
          message={`Remove "${sources.find(s => s.id === confirmRemove)?.name || 'this source'}"? You can add it back later.`}
          confirmLabel="Remove"
          confirmStyle="danger"
          onConfirm={() => removeSource(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  )
}

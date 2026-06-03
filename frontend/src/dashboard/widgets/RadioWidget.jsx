import { useState, useEffect } from 'react'
import * as player from './radioPlayer'

const DEFAULT_STATIONS = [
  // US News ✅
  { name:'NPR News',           url:'https://npr-ice.streamguys1.com/live.mp3',                                                        genre:'US News'   },
  { name:'Fox News Radio',     url:'/api/radio/stream?url=https%3A%2F%2Ffoxnewsradio.streamguys1.com%2Flive.mp3',                    genre:'US News'   },
  { name:'ABC News Radio',     url:'/api/radio/stream?url=https%3A%2F%2Fabcnewsradio.streamguys1.com%2Flive.mp3',                    genre:'US News'   },
  { name:'KQED (SF)',          url:'https://streams.kqed.org/kqedradio',                                                              genre:'US News'   },
  // Europe News ✅
  { name:'BBC World Service',  url:'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',                                         genre:'EU News'   },
  { name:'BBC Radio 4',        url:'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_four_fm',                                         genre:'EU News'   },
  { name:'France Info',        url:'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',                                             genre:'EU News'   },
  { name:'France Inter',       url:'https://icecast.radiofrance.fr/franceinter-midfi.mp3',                                            genre:'EU News'   },
  { name:'RFI English',        url:'/api/radio/stream?url=https%3A%2F%2Frfienglish.ice.infomaniak.ch%2Frfienglish-midfi.mp3',        genre:'EU News'   },
  // Pop ✅
  { name:'BBC Radio 1',        url:'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',       genre:'Pop'       },
  { name:'BBC Radio 2',        url:'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_two',       genre:'Pop'       },
  // 70s ✅
  { name:'SomaFM 70s',         url:'https://ice2.somafm.com/seventies-128-mp3',                 genre:'70s'       },
  { name:'BigR 70s',           url:'http://bigrradio.cdnstream1.com/5107_128',                  genre:'70s'       },
  // 80s ✅
  { name:'SomaFM 80s',         url:'https://ice2.somafm.com/u80s-128-mp3',                      genre:'80s'       },
  { name:'BigR 80s',           url:'http://bigrradio.cdnstream1.com/5106_128',                  genre:'80s'       },
  // 90s ✅
  { name:'BigR 90s',           url:'http://bigrradio.cdnstream1.com/5105_128',                  genre:'90s'       },
  // Beatles ✅ proxied
  { name:'Beatles Radio',      url:'/api/radio/stream?url=http%3A%2F%2Fwww.beatlesradio.com%3A8000%2Fstream%2F1%2F', genre:'Beatles' },
  // Jazz ✅
  { name:'Jazz 24',            url:'https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1',   genre:'Jazz'      },
  { name:'SomaFM Lush',        url:'https://ice2.somafm.com/lush-128-mp3',                     genre:'Jazz'      },
  { name:'SomaFM BAGeL',       url:'https://ice2.somafm.com/bagel-128-mp3',                    genre:'Jazz'      },
  // Classical ✅
  { name:'Classic FM UK',      url:'https://media-ice.musicradio.com/ClassicFMMP3',             genre:'Classical' },
  { name:'WQXR Classical',     url:'https://stream.wqxr.org/wqxr',                              genre:'Classical' },
  { name:'Classical MPR',      url:'https://nis.stream.publicradio.org/nis.mp3',                genre:'Classical' },
  { name:'WFMT Classical',     url:'https://stream.wfmt.com/wfmt-mid',                          genre:'Classical' },
  { name:'ABC Classic FM',     url:'https://live-radio01.mediahubaustralia.com/2ABCr/mp3/',     genre:'Classical' },
  // Ambient ✅
  { name:'SomaFM Groove',      url:'https://ice1.somafm.com/groovesalad-256-mp3',               genre:'Ambient'   },
  { name:'SomaFM Drone',       url:'https://ice1.somafm.com/dronezone-256-mp3',                 genre:'Ambient'   },
  { name:'SomaFM Deep Space',  url:'https://ice2.somafm.com/deepspaceone-128-mp3',              genre:'Ambient'   },
  // Indie ✅
  { name:'SomaFM Indie Pop',   url:'https://ice2.somafm.com/indiepop-128-mp3',                  genre:'Indie'     },
  // Peru ✅ proxied
  { name:'Onda Cero Peru',     url:'/api/radio/stream?url=http%3A%2F%2F198.154.106.100%3A8040%2Fstream',    genre:'Peru' },
]

const GENRES = [...new Set(DEFAULT_STATIONS.map(s => s.genre))]

const pulseKeyframes = `
@keyframes rw-pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50% { opacity:.5; transform:scale(1.3); }
}
`

export default function RadioWidget({ config, onUpdate }) {
  const stations = config.stations?.length ? config.stations : DEFAULT_STATIONS
  // Sync state from singleton player (so UI reflects what's playing even after re-mount)
  const [playerState, setPlayerState] = useState(player.getState)
  const current = playerState.station
  const playing = playerState.playing
  const volume  = playerState.volume !== undefined ? playerState.volume : (config.volume ?? 0.8)

  const [error, setError]           = useState('')
  const [newName, setNewName]       = useState('')
  const [newUrl, setNewUrl]         = useState('')
  const [newGenre, setNewGenre]     = useState(GENRES[0])
  const [newCatInput, setNewCatInput] = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showCatMgr, setShowCatMgr] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  // Custom categories + ordering stored in config
  const customCats = config.customCats || []
  const rawCats = [...new Set([...GENRES, ...customCats, ...stations.map(s => s.genre)])]
  // Respect saved order; append any new cats at the end
  const savedOrder = config.catOrder || []
  const allCats = [...savedOrder.filter(c => rawCats.includes(c)), ...rawCats.filter(c => !savedOrder.includes(c))]

  function moveCat(cat, dir) {
    const arr = [...allCats]
    const i = arr.indexOf(cat)
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onUpdate({ catOrder: arr })
  }

  // Subscribe to singleton player state changes
  useEffect(() => {
    player.setVolume(config.volume ?? 0.8)
    const unsub = player.subscribe(setPlayerState)
    return unsub // no audio pause on unmount — keeps playing!
  }, [])

  function playStation(station) {
    setError('')
    try {
      player.play(station)
      onUpdate({ currentStation: station })
    } catch {
      setError(`Could not play: ${station.name}`)
    }
  }

  function togglePlay() {
    if (playing && current) {
      player.pause()
    } else if (current) {
      player.play(current)
    }
  }

  function handleVolume(e) {
    const v = Number(e.target.value) / 100
    player.setVolume(v)
    onUpdate({ volume: v })
  }

  function addStation() {
    if (!newName.trim() || !newUrl.trim()) return
    const genre = newCatInput.trim() || newGenre
    const s = { name: newName.trim(), url: newUrl.trim(), genre }
    const updated = [...stations, s]
    // Save new custom cat if needed
    const cats = [...customCats]
    if (!allCats.includes(genre)) cats.push(genre)
    onUpdate({ stations: updated, customCats: cats })
    setNewName(''); setNewUrl(''); setNewCatInput(''); setShowAdd(false)
  }

  function removeStation(idx) {
    onUpdate({ stations: stations.filter((_, i) => i !== idx) })
  }

  function moveStation(idx, dir) {
    const arr = [...stations]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    // Only swap within same genre
    if (arr[idx].genre !== arr[target].genre) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onUpdate({ stations: arr })
  }

  function addCategory() {
    if (!newCatName.trim()) return
    if (allCats.includes(newCatName.trim())) return
    const newCats = [...customCats, newCatName.trim()]
    onUpdate({ customCats: newCats, catOrder: [...allCats, newCatName.trim()] })
    setNewCatName('')
  }

  function removeCategory(cat) {
    // Remove category and reassign its stations to first available cat
    const updated = stations.map(s => s.genre === cat ? { ...s, genre: GENRES[0] } : s)
    onUpdate({ stations: updated, customCats: customCats.filter(c => c !== cat) })
  }

  // Build grouped list in order
  const grouped = {}
  allCats.forEach(g => {
    const list = stations.filter(s => s.genre === g)
    if (list.length) grouped[g] = list
  })

  return (
    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12 }}>
      <style>{pulseKeyframes}</style>

      {/* Now playing — hero */}
      <div style={{ background:'linear-gradient(135deg, var(--s2), var(--s3))', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
        {current ? (
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <span style={{ display:'inline-block', color:'var(--accent)', fontSize:32, lineHeight:1,
              animation: playing ? 'rw-pulse 1s ease-in-out infinite' : 'none' }}>♪</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:2 }}>
                {playing ? '▶ Now Playing' : 'Selected'}
              </div>
              <div style={{ fontWeight:800, fontSize:16, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{current.name}</div>
              <div style={{ marginTop:5 }}>
                <span style={{ background:'rgba(91,127,255,.15)', border:'1px solid rgba(91,127,255,.3)', borderRadius:10, padding:'2px 10px', fontSize:10, color:'var(--accent2)' }}>{current.genre}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color:'var(--text3)', marginBottom:12, textAlign:'center', padding:'8px 0', fontSize:13 }}>← Select a station to play</div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={togglePlay} disabled={!current}
            style={{ background: playing ? 'var(--accent)' : 'var(--s4)', color: playing ? '#fff' : 'var(--text)',
              border:`1px solid ${playing ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius:8, padding:'8px 20px', cursor: current ? 'pointer' : 'default', fontSize:14, fontWeight:800, flexShrink:0 }}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={handleVolume}
            style={{ flex:1, accentColor:'var(--accent)', cursor:'pointer' }} title="Volume" />
          <span style={{ color:'var(--text3)', fontSize:11, minWidth:32, textAlign:'right' }}>{Math.round(volume * 100)}%</span>
        </div>
        {error && <div style={{ color:'var(--red)', fontSize:11, marginTop:8 }}>{error}</div>}
      </div>

      {/* Station list with ▲▼ reorder */}
      <div style={{ maxHeight:280, overflowY:'auto', marginBottom:8, scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent' }}>
        {Object.entries(grouped).map(([genre, list]) => (
          <div key={genre} style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3, display:'flex', alignItems:'center' }}>
              <span style={{ flex:1 }}>{genre}</span>
              <span style={{ opacity:.5 }}>({list.length})</span>
            </div>
            {list.map((s, i) => {
              const idx = stations.indexOf(s)
              const isActive = current?.url === s.url
              const genreList = stations.filter(x => x.genre === genre)
              const pos = genreList.indexOf(s)
              return (
                <div key={s.url + i} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 6px', borderRadius:7,
                  background: isActive ? 'rgba(91,127,255,.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(91,127,255,.2)' : '1px solid transparent', marginBottom:2 }}>
                  <button onClick={() => playStation(s)}
                    style={{ background:'none', border:'none', color: isActive ? 'var(--accent)' : 'var(--text3)', cursor:'pointer', fontSize:13, lineHeight:1, padding:0, minWidth:16 }}>
                    {isActive && playing ? '■' : '▶'}
                  </button>
                  <span onClick={() => playStation(s)} style={{ flex:1, cursor:'pointer', color: isActive ? 'var(--accent2)' : 'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>
                    {s.name}
                  </span>
                  <button onClick={() => moveStation(idx, -1)} disabled={pos===0}
                    style={{ background:'none', border:'none', color: pos===0 ? 'var(--border2)' : 'var(--text3)', cursor: pos===0 ? 'default' : 'pointer', fontSize:9, padding:'0 1px', lineHeight:1 }}>▲</button>
                  <button onClick={() => moveStation(idx, 1)} disabled={pos===genreList.length-1}
                    style={{ background:'none', border:'none', color: pos===genreList.length-1 ? 'var(--border2)' : 'var(--text3)', cursor: pos===genreList.length-1 ? 'default' : 'pointer', fontSize:9, padding:'0 1px', lineHeight:1 }}>▼</button>
                  <button onClick={() => removeStation(idx)}
                    style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:12, lineHeight:1, padding:'0 1px', opacity:.4 }}
                    onMouseEnter={e => { e.target.style.opacity=1; e.target.style.color='var(--red)' }}
                    onMouseLeave={e => { e.target.style.opacity=.4; e.target.style.color='var(--text3)' }}>×</button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Category manager */}
      {showCatMgr && (
        <div style={{ background:'var(--s3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px', marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, marginBottom:8 }}>📂 Manage Categories</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:8 }}>
            {allCats.map((cat, i) => (
              <div key={cat} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'5px 8px 5px 10px', fontSize:11 }}>
                <span style={{ flex:1 }}>{cat}
                  <span style={{ color:'var(--text3)', marginLeft:6, fontSize:9 }}>({stations.filter(s => s.genre===cat).length})</span>
                </span>
                <button onClick={() => moveCat(cat, -1)} disabled={i===0}
                  style={{ background:'none', border:'none', color: i===0 ? 'var(--border2)' : 'var(--text3)', cursor: i===0 ? 'default' : 'pointer', fontSize:9, padding:'0 2px', lineHeight:1 }}>▲</button>
                <button onClick={() => moveCat(cat, 1)} disabled={i===allCats.length-1}
                  style={{ background:'none', border:'none', color: i===allCats.length-1 ? 'var(--border2)' : 'var(--text3)', cursor: i===allCats.length-1 ? 'default' : 'pointer', fontSize:9, padding:'0 2px', lineHeight:1 }}>▼</button>
                {customCats.includes(cat) && (
                  <button onClick={() => removeCategory(cat)}
                    style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:12, lineHeight:1, padding:'0 2px', opacity:.5 }}
                    onMouseEnter={e => { e.target.style.opacity=1; e.target.style.color='var(--red)' }}
                    onMouseLeave={e => { e.target.style.opacity=.5; e.target.style.color='var(--text3)' }}>×</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key==='Enter' && addCategory()}
              placeholder="New category name…"
              style={{ flex:1, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:11, padding:'5px 8px', outline:'none' }} />
            <button onClick={addCategory}
              style={{ background:'var(--accent)', border:'none', borderRadius:6, color:'#fff', fontSize:11, padding:'5px 10px', cursor:'pointer' }}>Add</button>
            <button onClick={() => setShowCatMgr(false)}
              style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:11, padding:'5px 8px', cursor:'pointer' }}>Done</button>
          </div>
        </div>
      )}

      {/* Add station / category buttons */}
      {showAdd ? (
        <div style={{ background:'var(--s3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 10px 8px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Station name"
            style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 8px', outline:'none', marginBottom:6, boxSizing:'border-box' }} />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Stream URL (mp3/aac)"
            style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 8px', outline:'none', marginBottom:6, boxSizing:'border-box' }} />
          <select value={newGenre} onChange={e => { setNewGenre(e.target.value); setNewCatInput('') }}
            style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 8px', outline:'none', marginBottom: newGenre==='__new__' ? 4 : 8, boxSizing:'border-box' }}>
            {allCats.map(g => <option key={g} value={g}>{g}</option>)}
            <option value="__new__">+ New category…</option>
          </select>
          {newGenre === '__new__' && (
            <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
              placeholder="Category name"
              style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--accent)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 8px', outline:'none', marginBottom:8, boxSizing:'border-box' }} />
          )}
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={addStation} disabled={!newName.trim()||!newUrl.trim()}
              style={{ flex:1, background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px', cursor:'pointer', fontSize:12 }}>Add</button>
            <button onClick={() => setShowAdd(false)}
              style={{ flex:1, background:'var(--s2)', color:'var(--text2)', border:'1px solid var(--border2)', borderRadius:6, padding:'6px', cursor:'pointer', fontSize:12 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => { setShowAdd(true); setShowCatMgr(false) }}
            style={{ flex:1, background:'var(--s2)', color:'var(--text2)', border:'1px dashed var(--border2)', borderRadius:8, padding:'7px', cursor:'pointer', fontSize:12, fontFamily:"'DM Mono',monospace" }}>
            + Add station
          </button>
          <button onClick={() => { setShowCatMgr(v => !v); setShowAdd(false) }}
            title="Manage categories"
            style={{ background: showCatMgr ? 'var(--accent)' : 'var(--s2)', color: showCatMgr ? '#fff' : 'var(--text3)', border:`1px solid ${showCatMgr ? 'var(--accent)' : 'var(--border2)'}`, borderRadius:8, padding:'7px 11px', cursor:'pointer', fontSize:13 }}>
            📂
          </button>
        </div>
      )}
    </div>
  )
}

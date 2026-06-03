import { useState, useRef, useEffect } from 'react'

const DEFAULT_STATIONS = [
  { name:'NPR News',         url:'https://npr-ice.streamguys1.com/live.mp3',                 genre:'News'      },
  { name:'BBC World Service', url:'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',  genre:'News'      },
  { name:'BBC Radio 1',      url:'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',       genre:'Pop'       },
  { name:'BBC Radio 2',      url:'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_two',       genre:'Pop'       },
  { name:'BBC Radio 4',      url:'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_four_fm',   genre:'General'   },
  { name:'SomaFM Groove',    url:'https://ice1.somafm.com/groovesalad-256-mp3',              genre:'Ambient'   },
  { name:'SomaFM Drone',     url:'https://ice1.somafm.com/dronezone-256-mp3',                genre:'Ambient'   },
  { name:'SomaFM Deep Space', url:'https://ice2.somafm.com/deepspaceone-128-mp3',            genre:'Ambient'   },
  { name:'SomaFM Indie Pop', url:'https://ice2.somafm.com/indiepop-128-mp3',                 genre:'Indie'     },
  { name:'Jazz 24',          url:'https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1',   genre:'Jazz'      },
  { name:'France Inter',     url:'https://icecast.radiofrance.fr/franceinter-midfi.mp3',     genre:'General'   },
  // Peru — proxied for ICY/CORS support
  { name:'RPP Noticias',     url:'/api/radio/stream?url=https%3A%2F%2Frpp-ice.streamguys1.com%2Frpp.mp3',              genre:'Peru' },
  { name:'Studio 92',        url:'/api/radio/stream?url=https%3A%2F%2Fstreaming.studio92.pe%2Fstudio92',               genre:'Peru' },
  { name:'Oxígeno',          url:'/api/radio/stream?url=https%3A%2F%2Fstreaming.oxigenoradio.com%2Foxigeno',           genre:'Peru' },
  { name:'CPN Radio',        url:'/api/radio/stream?url=https%3A%2F%2Fstreaming.cpnradio.pe%2Fcpnradio',              genre:'Peru' },
  { name:'Moda 106.5',       url:'/api/radio/stream?url=https%3A%2F%2Fstreaming.moda.pe%2Fmoda',                      genre:'Peru' },
  { name:'Capital 96.7',     url:'/api/radio/stream?url=https%3A%2F%2Fstreaming.capital.pe%2Fcapital',                genre:'Peru' },
  // Beatles — proxied for ICY support
  { name:'Beatles Radio',    url:'/api/radio/stream?url=https%3A%2F%2Fwww.beatlesradio.com%3A8000%2Fstream%2F1%2F', genre:'Beatles' },
  { name:'Abbey Road Radio', url:'/api/radio/stream?url=https%3A%2F%2Fabbeyroadradio.com%2Fstream',                  genre:'Beatles' },
  // Soft Jazz ✅ verified
  { name:'1.FM Smooth Jazz', url:'https://strm112.1.fm/smoothjazz_mobile_mp3',              genre:'Soft Jazz' },
  { name:'SomaFM Lush',      url:'https://ice2.somafm.com/lush-128-mp3',                    genre:'Soft Jazz' },
  { name:'SomaFM BAGeL',     url:'https://ice2.somafm.com/bagel-128-mp3',                   genre:'Soft Jazz' },
  { name:'Jazz 24',          url:'https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1',  genre:'Soft Jazz' },
  // Classical ✅ verified
  { name:'Classic FM UK',    url:'https://media-ice.musicradio.com/ClassicFMMP3',            genre:'Classical' },
  { name:'WQXR Classical',   url:'https://stream.wqxr.org/wqxr',                             genre:'Classical' },
  { name:'Classical MPR',    url:'https://nis.stream.publicradio.org/nis.mp3',               genre:'Classical' },
  { name:'WFMT Classical',   url:'https://stream.wfmt.com/wfmt-mid',                         genre:'Classical' },
  { name:'ABC Classic FM',   url:'https://live-radio01.mediahubaustralia.com/2ABCr/mp3/',    genre:'Classical' },
  // SomaFM extras ✅ verified
  { name:'SomaFM Deep Space',url:'https://ice2.somafm.com/deepspaceone-128-mp3',             genre:'Ambient' },
  { name:'SomaFM Indie Pop', url:'https://ice2.somafm.com/indiepop-128-mp3',                 genre:'Indie' },
  { name:'SomaFM Lush',      url:'https://ice2.somafm.com/lush-128-mp3',                     genre:'Ambient' },
  { name:'Underground 80s',  url:'https://ice2.somafm.com/u80s-128-mp3',                     genre:'Pop' },
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
  const volume    = config.volume ?? 0.8
  const [current, setCurrent]   = useState(config.currentStation || null)
  const [playing, setPlaying]   = useState(false)
  const [error, setError]       = useState('')
  const [newName, setNewName]   = useState('')
  const [newUrl, setNewUrl]     = useState('')
  const [newGenre, setNewGenre] = useState('General')
  const [showAdd, setShowAdd]   = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  function playStation(station) {
    setError('')
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.src = station.url
    audio.load()
    const playPromise = audio.play()
    if (playPromise) {
      playPromise.then(() => {
        setCurrent(station)
        setPlaying(true)
        onUpdate({ currentStation: station })
      }).catch(() => {
        setError(`Could not play: ${station.name}`)
        setPlaying(false)
      })
    }
    audio.onerror = () => {
      setError(`Stream unavailable: ${station.name}`)
      setPlaying(false)
    }
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else if (current) {
      audio.play().then(() => setPlaying(true)).catch(() => setError('Playback failed'))
    }
  }

  function handleVolume(e) {
    const v = Number(e.target.value) / 100
    if (audioRef.current) audioRef.current.volume = v
    onUpdate({ volume: v })
  }

  function addStation() {
    if (!newName.trim() || !newUrl.trim()) return
    const s = { name: newName.trim(), url: newUrl.trim(), genre: newGenre }
    const updated = [...stations, s]
    onUpdate({ stations: updated })
    setNewName('')
    setNewUrl('')
    setShowAdd(false)
  }

  function removeStation(idx) {
    const updated = stations.filter((_, i) => i !== idx)
    onUpdate({ stations: updated })
  }

  const grouped = GENRES.reduce((acc, g) => {
    const list = stations.filter(s => s.genre === g)
    if (list.length) acc[g] = list
    return acc
  }, {})
  const otherStations = stations.filter(s => !GENRES.includes(s.genre))
  if (otherStations.length) grouped['Other'] = otherStations

  return (
    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12 }}>
      <style>{pulseKeyframes}</style>

      {/* Now playing */}
      <div style={{ background:'var(--s3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
        {current ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            {playing && (
              <span style={{ animation:'rw-pulse 1s ease-in-out infinite', display:'inline-block', color:'var(--accent)', fontSize:16 }}>♪</span>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{current.name}</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                <span style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:10, padding:'1px 7px' }}>{current.genre}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color:'var(--text3)', marginBottom:8 }}>No station selected</div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={togglePlay} disabled={!current}
            style={{ background: playing ? 'var(--accent)' : 'var(--s2)', color: playing ? '#fff' : 'var(--text)', border:'1px solid var(--border2)', borderRadius:8, padding:'5px 14px', cursor: current ? 'pointer' : 'default', fontSize:13, fontWeight:700 }}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={handleVolume}
            style={{ flex:1, accentColor:'var(--accent)', cursor:'pointer' }} title="Volume" />
          <span style={{ color:'var(--text3)', fontSize:10, minWidth:28, textAlign:'right' }}>{Math.round(volume * 100)}%</span>
        </div>
        {error && <div style={{ color:'var(--red)', fontSize:11, marginTop:8 }}>{error}</div>}
      </div>

      {/* Station list */}
      <div style={{ maxHeight:220, overflowY:'auto', marginBottom:10 }}>
        {Object.entries(grouped).map(([genre, list]) => (
          <div key={genre} style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>{genre}</div>
            {list.map((s, i) => {
              const idx = stations.indexOf(s)
              const isActive = current?.url === s.url
              return (
                <div key={s.url + i}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:8, background: isActive ? 'rgba(91,127,255,.1)' : 'transparent', marginBottom:2 }}>
                  <button onClick={() => playStation(s)}
                    style={{ background:'none', border:'none', color: isActive ? 'var(--accent)' : 'var(--text3)', cursor:'pointer', fontSize:14, lineHeight:1, padding:0, minWidth:18 }}>
                    {isActive && playing ? '■' : '▶'}
                  </button>
                  <span onClick={() => playStation(s)} style={{ flex:1, cursor:'pointer', color: isActive ? 'var(--accent2)' : 'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {s.name}
                  </span>
                  <button onClick={() => removeStation(idx)}
                    style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, lineHeight:1, padding:'0 2px', opacity:.5 }}
                    onMouseEnter={e => { e.target.style.opacity=1; e.target.style.color='var(--red)' }}
                    onMouseLeave={e => { e.target.style.opacity=.5; e.target.style.color='var(--text3)' }}>×</button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Add station */}
      {showAdd ? (
        <div style={{ background:'var(--s3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 10px 8px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Station name"
            style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 8px', outline:'none', marginBottom:6, boxSizing:'border-box' }} />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Stream URL (mp3/aac)"
            style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 8px', outline:'none', marginBottom:6, boxSizing:'border-box' }} />
          <select value={newGenre} onChange={e => setNewGenre(e.target.value)}
            style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'6px 8px', outline:'none', marginBottom:8, boxSizing:'border-box' }}>
            {[...GENRES,'Other','General'].filter((g,i,a)=>a.indexOf(g)===i).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={addStation} disabled={!newName.trim()||!newUrl.trim()}
              style={{ flex:1, background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px', cursor:'pointer', fontSize:12 }}>Add</button>
            <button onClick={() => setShowAdd(false)}
              style={{ flex:1, background:'var(--s2)', color:'var(--text2)', border:'1px solid var(--border2)', borderRadius:6, padding:'6px', cursor:'pointer', fontSize:12 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          style={{ width:'100%', background:'var(--s2)', color:'var(--text2)', border:'1px dashed var(--border2)', borderRadius:8, padding:'7px', cursor:'pointer', fontSize:12, fontFamily:"'DM Mono',monospace" }}>
          + Add station
        </button>
      )}
    </div>
  )
}

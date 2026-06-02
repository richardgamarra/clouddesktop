import { useState, useEffect, useRef } from 'react'

const WORK_SECS = 25 * 60
const BREAK_SECS = 5 * 60

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8)
  } catch {}
}

export default function PomodoroWidget() {
  const [isWork, setIsWork] = useState(true)
  const [secs, setSecs]     = useState(WORK_SECS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(prev => {
          if (prev <= 1) {
            beep()
            const nextIsWork = !isWork
            setIsWork(nextIsWork)
            setRunning(false)
            return nextIsWork ? WORK_SECS : BREAK_SECS
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, isWork])

  function reset() { setRunning(false); setSecs(isWork ? WORK_SECS : BREAK_SECS) }
  function switchMode(work) { setRunning(false); setIsWork(work); setSecs(work ? WORK_SECS : BREAK_SECS) }

  const mins = String(Math.floor(secs / 60)).padStart(2, '0')
  const seconds = String(secs % 60).padStart(2, '0')
  const progress = 1 - secs / (isWork ? WORK_SECS : BREAK_SECS)

  const btnStyle = (active) => ({
    background: active ? 'var(--accent)' : 'var(--s3)', border:'1px solid var(--border2)',
    borderRadius:6, padding:'4px 12px', fontSize:11, cursor:'pointer',
    color: active ? '#fff' : 'var(--text2)', fontFamily:"'DM Mono',monospace",
  })

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:12 }}>
        <button style={btnStyle(isWork)} onClick={() => switchMode(true)}>Work 25m</button>
        <button style={btnStyle(!isWork)} onClick={() => switchMode(false)}>Break 5m</button>
      </div>
      <div style={{ position:'relative', width:100, height:100, margin:'0 auto 12px' }}>
        <svg width={100} height={100} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={50} cy={50} r={44} fill="none" stroke="var(--border)" strokeWidth={6} />
          <circle cx={50} cy={50} r={44} fill="none"
            stroke={isWork ? 'var(--accent)' : 'var(--green, #4ade80)'}
            strokeWidth={6} strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
            strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.5s' }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:24, fontWeight:800, fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{mins}:{seconds}</div>
          <div style={{ fontSize:9, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{isWork ? 'FOCUS' : 'BREAK'}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
        <button onClick={() => setRunning(v => !v)}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px 18px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset}
          style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12, color:'var(--text2)', fontFamily:"'DM Mono',monospace" }}>
          Reset
        </button>
      </div>
    </div>
  )
}

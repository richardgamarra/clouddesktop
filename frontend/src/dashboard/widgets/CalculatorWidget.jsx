import { useState } from 'react'

export default function CalculatorWidget() {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [reset, setReset] = useState(false)

  function digit(d) {
    if (reset) { setDisplay(String(d)); setReset(false); return }
    setDisplay(display === '0' ? String(d) : display + d)
  }

  function dot() {
    if (reset) { setDisplay('0.'); setReset(false); return }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  function operator(o) {
    setPrev(parseFloat(display)); setOp(o); setReset(true)
  }

  function equals() {
    if (op === null || prev === null) return
    const cur = parseFloat(display)
    let result
    if (op === '+') result = prev + cur
    else if (op === '-') result = prev - cur
    else if (op === '*') result = prev * cur
    else if (op === '/') result = cur !== 0 ? prev / cur : 'Err'
    setDisplay(typeof result === 'number' ? String(parseFloat(result.toFixed(10))) : result)
    setPrev(null); setOp(null); setReset(true)
  }

  function clear() { setDisplay('0'); setPrev(null); setOp(null); setReset(false) }

  const btn = (label, action, style = {}) => (
    <button key={label} onClick={action}
      style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, fontSize:13, fontFamily:"'DM Mono',monospace", padding:'8px 0', cursor:'pointer', color:'var(--text)', ...style }}>
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, padding:'6px 10px', marginBottom:8, textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, minHeight:34, wordBreak:'break-all' }}>
        {display}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
        {btn('C', clear, { color:'var(--red)', fontWeight:700 })}
        {btn('±', () => setDisplay(String(-parseFloat(display))))}
        {btn('%', () => setDisplay(String(parseFloat(display)/100)))}
        {btn('÷', () => operator('/'), { color:'var(--accent)', fontWeight:700 })}
        {btn('7', () => digit('7'))}{btn('8', () => digit('8'))}{btn('9', () => digit('9'))}
        {btn('×', () => operator('*'), { color:'var(--accent)', fontWeight:700 })}
        {btn('4', () => digit('4'))}{btn('5', () => digit('5'))}{btn('6', () => digit('6'))}
        {btn('−', () => operator('-'), { color:'var(--accent)', fontWeight:700 })}
        {btn('1', () => digit('1'))}{btn('2', () => digit('2'))}{btn('3', () => digit('3'))}
        {btn('+', () => operator('+'), { color:'var(--accent)', fontWeight:700 })}
        {btn('0', () => digit('0'), { gridColumn:'span 2' })}
        {btn('.', dot)}
        {btn('=', equals, { background:'var(--accent)', color:'#fff', fontWeight:700, border:'none' })}
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import ClockWidget     from '../widgets/ClockWidget'
import WeatherWidget   from '../widgets/WeatherWidget'
import CryptoWidget    from '../widgets/CryptoWidget'
import StocksWidget    from '../widgets/StocksWidget'
import CurrencyWidget  from '../widgets/CurrencyWidget'
import CalendarWidget  from '../widgets/CalendarWidget'
import PomodoroWidget  from '../widgets/PomodoroWidget'
import CountdownWidget from '../widgets/CountdownWidget'
import CalculatorWidget from '../widgets/CalculatorWidget'
import TodoWidget        from '../widgets/TodoWidget'
import CommoditiesWidget from '../widgets/CommoditiesWidget'
import RadioWidget        from '../widgets/RadioWidget'

const WIDGET_TYPES = [
  { type:'clock',      icon:'🕐', name:'World Clock',  desc:'Multiple timezone clocks',   defaultConfig:{ cities:[] } },
  { type:'weather',    icon:'🌤', name:'Weather',       desc:'Live city forecast',         defaultConfig:{ city:'', lat:null, lon:null } },
  { type:'crypto',     icon:'₿',  name:'Crypto',        desc:'Live coin prices',           defaultConfig:{ coins:['bitcoin','ethereum','solana','cardano','dogecoin'] } },
  { type:'stocks',     icon:'📈', name:'Stocks',        desc:'Stock prices',               defaultConfig:{ symbols:['AAPL','TSLA','MSFT','GOOGL','AMZN'] } },
  { type:'currency',   icon:'💱', name:'Currency',      desc:'Currency converter',         defaultConfig:{ base:'USD' } },
  { type:'calendar',   icon:'📅', name:'Calendar',      desc:'Current month view',         defaultConfig:{} },
  { type:'pomodoro',   icon:'⏱', name:'Pomodoro',      desc:'25/5 focus timer',           defaultConfig:{} },
  { type:'countdown',  icon:'⏳', name:'Countdown',     desc:'Count down to a date',       defaultConfig:{ label:'', targetDate:'' } },
  { type:'calculator', icon:'🧮', name:'Calculator',    desc:'Standard calculator',        defaultConfig:{} },
  { type:'todo',        icon:'✅', name:'Quick To-Do',    desc:'Checkbox list, auto-saves',   defaultConfig:{ items:[] } },
  { type:'commodities', icon:'🥇', name:'Commodities',   desc:'Gold, oil, grains & more',    defaultConfig:{ symbols:['GC=F','SI=F','CL=F','NG=F','ZC=F'] } },
  { type:'radio',       icon:'📻', name:'Radio',          desc:'Internet radio player',        defaultConfig:{ stations:[], volume:0.8 } },
]

function WidgetComponent({ widget, onUpdate }) {
  const props = { config: widget.config, onUpdate }
  switch (widget.type) {
    case 'clock':      return <ClockWidget {...props} />
    case 'weather':    return <WeatherWidget {...props} />
    case 'crypto':     return <CryptoWidget {...props} />
    case 'stocks':     return <StocksWidget {...props} />
    case 'currency':   return <CurrencyWidget {...props} />
    case 'calendar':   return <CalendarWidget />
    case 'pomodoro':   return <PomodoroWidget />
    case 'countdown':  return <CountdownWidget {...props} />
    case 'calculator': return <CalculatorWidget />
    case 'todo':        return <TodoWidget {...props} />
    case 'commodities': return <CommoditiesWidget {...props} />
    case 'radio':       return <RadioWidget {...props} />
    default:            return null
  }
}

export default function WidgetsTab({ tab, onUpdateTab }) {
  const widgets = tab.config.widgets || []
  const [showPicker, setShowPicker] = useState(false)
  const [dragOver, setDragOver] = useState(null)
  const dragId = useRef(null)

  function updateWidget(widgetId, configPatch) {
    const updated = widgets.map(w =>
      w.id === widgetId ? { ...w, config: { ...w.config, ...configPatch } } : w
    )
    onUpdateTab(tab.id, { config: { ...tab.config, widgets: updated } })
  }

  function addWidget(type) {
    const def = WIDGET_TYPES.find(t => t.type === type)
    const nw = { id: 'w_' + Date.now(), type, config: { ...def.defaultConfig } }
    onUpdateTab(tab.id, { config: { ...tab.config, widgets: [...widgets, nw] } })
    setShowPicker(false)
  }

  function removeWidget(id) {
    onUpdateTab(tab.id, { config: { ...tab.config, widgets: widgets.filter(w => w.id !== id) } })
  }

  // Drag handlers
  function onDragStart(e, id) {
    dragId.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, id) {
    e.preventDefault()
    if (id !== dragId.current) setDragOver(id)
  }

  function onDrop(e, targetId) {
    e.preventDefault()
    const srcId = dragId.current
    if (!srcId || srcId === targetId) { setDragOver(null); return }
    const arr = [...widgets]
    const si = arr.findIndex(w => w.id === srcId)
    const ti = arr.findIndex(w => w.id === targetId)
    const [item] = arr.splice(si, 1)
    arr.splice(ti, 0, item)
    onUpdateTab(tab.id, { config: { ...tab.config, widgets: arr } })
    dragId.current = null
    setDragOver(null)
  }

  function onDragEnd() { dragId.current = null; setDragOver(null) }

  return (
    <div style={{ padding:'20px 24px' }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => setShowPicker(v => !v)}
          style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {showPicker ? '× Close' : '+ Add Widget'}
        </button>
        {widgets.length > 0 && (
          <span style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''} · drag ⠿ to reorder
          </span>
        )}
      </div>

      {/* Widget picker */}
      {showPicker && (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:12, color:'var(--text2)' }}>Choose a widget to add:</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
            {WIDGET_TYPES.map(wt => (
              <div key={wt.type} onClick={() => addWidget(wt.type)}
                style={{ background:'var(--s3)', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', cursor:'pointer', transition:'all var(--t)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='rgba(91,127,255,.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--s3)' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{wt.icon}</div>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{wt.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", lineHeight:1.4 }}>{wt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {widgets.length === 0 && !showPicker && (
        <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:13, textAlign:'center', marginTop:60 }}>
          No widgets yet. Click "+ Add Widget" to get started.
        </div>
      )}

      {/* Widget grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
        {widgets.map(widget => {
          const def = WIDGET_TYPES.find(t => t.type === widget.type)
          const isDragTarget = dragOver === widget.id
          return (
            <div key={widget.id}
              draggable
              onDragStart={e => onDragStart(e, widget.id)}
              onDragOver={e => onDragOver(e, widget.id)}
              onDrop={e => onDrop(e, widget.id)}
              onDragEnd={onDragEnd}
              style={{
                background:'var(--s2)',
                border:`1px solid ${isDragTarget ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:12,
                padding:16,
                position:'relative',
                transition:'border-color .15s, box-shadow .15s',
                boxShadow: isDragTarget ? '0 0 0 2px rgba(91,127,255,.25)' : 'none',
              }}>
              {/* Card header */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                {/* Drag handle */}
                <span
                  title="Drag to reorder"
                  style={{ cursor:'grab', color:'var(--text3)', fontSize:14, lineHeight:1, userSelect:'none', marginRight:2 }}>
                  ⠿
                </span>
                <span style={{ fontSize:16 }}>{def?.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, flex:1 }}>{def?.name}</span>
                <button onClick={() => removeWidget(widget.id)}
                  style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, lineHeight:1, padding:'2px 4px' }}
                  onMouseEnter={e => e.target.style.color='var(--red)'}
                  onMouseLeave={e => e.target.style.color='var(--text3)'}>×</button>
              </div>
              <WidgetComponent widget={widget} onUpdate={patch => updateWidget(widget.id, patch)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarWidget() {
  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()
  const todayDate = today.getDate()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const cellStyle = (d) => ({
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: 'default',
    background: d === todayDate ? 'var(--accent)' : 'transparent',
    color: d === todayDate ? '#fff' : d ? 'var(--text2)' : 'transparent',
    fontWeight: d === todayDate ? 800 : 400,
  })

  return (
    <div>
      <div style={{ textAlign:'center', fontWeight:700, fontSize:13, marginBottom:8 }}>
        {MONTH_NAMES[month]} {year}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", paddingBottom:4 }}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'center' }}>
            <div style={cellStyle(d)}>{d || ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', confirmStyle = 'danger', onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:28, width:380, boxShadow:'0 28px 72px rgba(0,0,0,.7)' }}>
        <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13, color:'var(--text2)', fontFamily:"'DM Mono',monospace", marginBottom:24, lineHeight:1.6 }}>{message}</div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              background: confirmStyle === 'danger' ? 'var(--red)' : confirmStyle === 'yellow' ? 'var(--yellow)' : 'var(--accent)',
              border:'none', borderRadius:8, color:'#fff',
              fontSize:13, fontWeight:700, padding:'8px 18px', cursor:'pointer'
            }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageGroupsModal({ groups, apps, onEdit, onNew, onMoveUp, onMoveDown, onClose }) {
  function appsInGroup(gid) { return apps.filter(a => a.groupId === gid).length }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 400 }}>
        <div className="modal-title">Manage Groups</div>
        <div className="modal-sub">Reorder, rename or delete your groups.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
          {groups.length === 0 && (
            <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12, textAlign:'center', padding:16 }}>No groups yet.</div>
          )}
          {groups.map((g, i) => (
            <div key={g.id} className="manage-group-row">
              <div style={{ width:12, height:12, borderRadius:'50%', background:g.color, flexShrink:0 }} />
              <div style={{ flex:1, fontSize:13, fontWeight:700 }}>{g.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{appsInGroup(g.id)} apps</div>
              <button className="dash-group-btn" onClick={() => onEdit(g.id)}>✎ Edit</button>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <button className="dash-group-btn" style={{ padding:'1px 6px', fontSize:10, opacity:i===0?.3:1 }} disabled={i===0} onClick={() => onMoveUp(g.id)}>▲</button>
                <button className="dash-group-btn" style={{ padding:'1px 6px', fontSize:10, opacity:i===groups.length-1?.3:1 }} disabled={i===groups.length-1} onClick={() => onMoveDown(g.id)}>▼</button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" style={{ background:'rgba(91,127,255,.13)', borderColor:'var(--accent)', color:'var(--accent2)' }} onClick={onNew}>+ New Group</button>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

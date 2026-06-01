import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLE_COLORS = {
  admin:   { bg:'rgba(167,139,250,.13)', color:'var(--purple)'  },
  premium: { bg:'rgba(61,220,170,.13)',  color:'var(--green)'   },
  free:    { bg:'rgba(91,127,255,.13)',  color:'var(--accent2)' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

export default function UsersPage() {
  const { accessToken } = useAuth()
  const [users, setUsers]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading]   = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 25 })
    if (search.trim()) params.set('search', search.trim())
    if (roleFilter)    params.set('role',   roleFilter)
    try {
      const res  = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function doAction(userId, action, extra = {}) {
    setActionMsg('')
    const res  = await fetch(`/api/admin/users/${userId}`, {
      method:  'PUT',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` },
      body:    JSON.stringify({ action, ...extra }),
    })
    const data = await res.json()
    setActionMsg(data.message || data.error || '')
    if (res.ok) fetchUsers()
    setTimeout(() => setActionMsg(''), 3000)
  }

  const totalPages = Math.ceil(total / 25)

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:6, letterSpacing:'-.5px' }}>👥 Users</h1>
      <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:24 }}>{total} total users</p>
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input type="text" placeholder="Search by email…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'8px 12px', outline:'none', width:260 }} />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'8px 12px', cursor:'pointer', appearance:'none' }}>
          <option value="">All roles</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {actionMsg && (
        <div style={{ background:'rgba(61,220,170,.1)', border:'1px solid rgba(61,220,170,.3)', borderRadius:8, padding:'8px 14px', fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--green)', marginBottom:14 }}>
          {actionMsg}
        </div>
      )}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 110px 110px 180px', padding:'10px 16px', borderBottom:'1px solid var(--border)', fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em' }}>
          <span>Email</span><span>Role</span><span>Verified</span><span>Joined</span><span>Last login</span><span>Actions</span>
        </div>
        {loading && <div style={{ padding:20, color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>}
        {!loading && users.length === 0 && <div style={{ padding:20, color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>No users found.</div>}
        {users.map(u => (
          <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 110px 110px 180px', padding:'11px 16px', borderBottom:'1px solid var(--border)', fontSize:12, alignItems:'center' }}>
            <span style={{ fontFamily:"'DM Mono',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</span>
            <span>
              <select value={u.role} onChange={e => doAction(u.id, 'set_role', { role: e.target.value })}
                style={{ background:ROLE_COLORS[u.role]?.bg, color:ROLE_COLORS[u.role]?.color, border:'none', borderRadius:20, padding:'2px 8px', fontSize:10, fontFamily:"'DM Mono',monospace", fontWeight:700, cursor:'pointer', appearance:'none' }}>
                <option value="free">free</option>
                <option value="premium">premium</option>
                <option value="admin">admin</option>
              </select>
            </span>
            <span>
              <button onClick={() => doAction(u.id, 'toggle_verified')}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:16 }}
                title={u.email_verified ? 'Click to unverify' : 'Click to verify'}>
                {u.email_verified ? '✅' : '❌'}
              </button>
            </span>
            <span style={{ fontFamily:"'DM Mono',monospace", color:'var(--text3)', fontSize:11 }}>{formatDate(u.created_at)}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", color:'var(--text3)', fontSize:11 }}>{formatDate(u.last_login_at)}</span>
            <span>
              <button onClick={() => { if (window.confirm(`Send password reset to ${u.email}?`)) doAction(u.id, 'reset_password') }}
                style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:10, fontFamily:"'DM Mono',monospace", padding:'3px 8px', cursor:'pointer' }}>
                Reset pw
              </button>
            </span>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:16, justifyContent:'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
            style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:12, fontFamily:"'DM Mono',monospace", padding:'5px 12px', cursor:'pointer', opacity:page===1?.4:1 }}>
            ← Prev
          </button>
          <span style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--text3)' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
            style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:12, fontFamily:"'DM Mono',monospace", padding:'5px 12px', cursor:'pointer', opacity:page===totalPages?.4:1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

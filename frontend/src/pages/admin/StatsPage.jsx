import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
      <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:36, fontWeight:800, letterSpacing:'-1px', color: color || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:4 }}>{sub}</div>}
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function StatsPage() {
  const { accessToken } = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setStats(d); setLoading(false) })
      .catch(() => { setError('Failed to load stats'); setLoading(false) })
  }, [accessToken])

  if (loading) return <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>Loading…</div>
  if (error)   return <div style={{ color:'var(--red)', fontFamily:"'DM Mono',monospace" }}>{error}</div>

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:6, letterSpacing:'-.5px' }}>📊 Stats</h1>
      <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:28 }}>Live counts from the database</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:14, marginBottom:32 }}>
        <StatCard label="Total Users"    value={stats.totalUsers}    color="var(--accent2)" />
        <StatCard label="Free"           value={stats.byRole.free}   />
        <StatCard label="Premium"        value={stats.byRole.premium} color="var(--green)" />
        <StatCard label="Admin"          value={stats.byRole.admin}  color="var(--purple)" />
        <StatCard label="Email Verified" value={stats.emailVerified} sub={`${stats.totalUsers ? Math.round(stats.emailVerified / stats.totalUsers * 100) : 0}% of total`} />
        <StatCard label="New Today"      value={stats.newToday}      color="var(--yellow)" />
        <StatCard label="New This Week"  value={stats.newThisWeek}   />
      </div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:13 }}>Recent Signups</div>
        {stats.recentSignups.length === 0 && (
          <div style={{ padding:'20px', color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>No users yet.</div>
        )}
        {stats.recentSignups.map(u => (
          <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--border)', fontSize:13 }}>
            <div style={{ flex:1, fontFamily:"'DM Mono',monospace", fontSize:12 }}>{u.email}</div>
            <div style={{ background: u.role==='admin'?'rgba(167,139,250,.13)':u.role==='premium'?'rgba(61,220,170,.13)':'rgba(91,127,255,.13)', color: u.role==='admin'?'var(--purple)':u.role==='premium'?'var(--green)':'var(--accent2)', borderRadius:20, padding:'2px 10px', fontSize:10, fontFamily:"'DM Mono',monospace", fontWeight:700 }}>{u.role}</div>
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{formatDate(u.created_at)}</div>
            <div style={{ width:8, height:8, borderRadius:'50%', background: u.email_verified?'var(--green)':'var(--text3)' }} title={u.email_verified?'Email verified':'Not verified'} />
          </div>
        ))}
      </div>
    </div>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin/stats',     label: '📊 Stats'     },
  { to: '/admin/users',     label: '👥 Users'     },
  { to: '/admin/broadcast', label: '📢 Broadcast' },
]

export default function AdminLayout({ children }) {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  async function handleLogout() { await logout(); navigate('/') }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <aside style={{ width:200, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'20px 0', flexShrink:0 }}>
        <div style={{ padding:'0 20px 20px', borderBottom:'1px solid var(--border)', marginBottom:12 }}>
          <div style={{ fontWeight:800, fontSize:15, letterSpacing:'-.3px' }}>⚙ Admin</div>
          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>CloudDesktop Workspace</div>
        </div>
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:2, padding:'0 8px' }}>
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'block', padding:'8px 12px', borderRadius:8, fontSize:13, fontWeight:600,
              textDecoration:'none', transition:'all .15s',
              background: isActive ? 'rgba(91,127,255,.13)' : 'transparent',
              color: isActive ? 'var(--accent2)' : 'var(--text2)',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)' }}>
          <NavLink to="/dashboard" style={{ display:'block', padding:'8px 12px', fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", textDecoration:'none' }}>
            ← Back to app
          </NavLink>
          <button onClick={handleLogout} style={{ display:'block', width:'100%', padding:'8px 12px', fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
            Log out
          </button>
        </div>
      </aside>
      <main style={{ flex:1, overflow:'auto', padding:'32px 40px' }}>
        {children}
      </main>
    </div>
  )
}

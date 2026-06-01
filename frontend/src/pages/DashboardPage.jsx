import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 52, height: 52, background: 'linear-gradient(135deg, var(--accent), var(--purple))',
        borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, color: '#fff'
      }}>CW</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px' }}>CloudDesktop Workspace</h1>
      <p style={{ color: 'var(--text2)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
        Logged in as {user?.email} · role: {user?.role}
      </p>
      <p style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
        Dashboard coming in Stage 4
      </p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: 8, background: 'var(--s2)', border: '1px solid var(--border2)',
          borderRadius: 8, color: 'var(--text2)', fontSize: 12,
          fontFamily: "'DM Mono', monospace", padding: '8px 16px'
        }}
      >
        Log out
      </button>
    </div>
  )
}

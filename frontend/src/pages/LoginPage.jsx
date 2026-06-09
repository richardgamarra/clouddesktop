import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      login(data.accessToken, data.user, password)
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      navigate(isMobile ? '/mobile' : '/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="/logo.png" alt="CloudDesktop" style={{ height:140, width:"auto" }} /></div>
        <div className="auth-title">Sign in</div>
        <div className="auth-sub">Welcome back to CloudDesktop Workspace</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 14, marginTop: -6 }}>
            <Link to="/reset-password" style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--accent2)' }}>
              Forgot password?
            </Link>
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </div>
      </div>
    </div>
  )
}

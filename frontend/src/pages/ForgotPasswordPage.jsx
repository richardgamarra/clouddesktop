import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setSuccess(data.message || 'If that email exists, a reset link has been sent.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">CW</div>
        <div className="auth-title">Reset password</div>
        <div className="auth-sub">Enter your email and we'll send a reset link</div>
        {error && <div className="auth-error">{error}</div>}
        {success ? (
          <div className="auth-success">{success}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link →'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          <Link to="/login">← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}

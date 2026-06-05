import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/api/auth/verify-email/${token}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Invalid or expired verification link.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Network error. Please try again.')
      })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo" style={{ margin: '0 auto 20px' }}><img src="/logo.png" alt="CloudDesktop" style={{ height:80, width:'auto' }} /></div>
        <div className="auth-title">Email verification</div>
        {status === 'loading' && (
          <p style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 16 }}>
            Verifying your email…
          </p>
        )}
        {status === 'success' && (
          <>
            <div className="auth-success" style={{ marginTop: 16 }}>{message}</div>
            <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
              Sign in →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="auth-error" style={{ marginTop: 16 }}>{message}</div>
            <div className="auth-footer" style={{ marginTop: 12 }}>
              <Link to="/signup">Create a new account</Link> · <Link to="/login">Sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

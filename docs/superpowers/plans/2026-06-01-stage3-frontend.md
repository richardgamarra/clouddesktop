# Stage 3: Landing Page + Auth Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing landing page and all auth pages (login, signup, forgot/reset password, email verify) as React components, replacing the placeholder App.jsx.

**Architecture:** React Router v6 handles all routing. An `AuthContext` stores the JWT access token in memory and exposes login/logout helpers. All pages share CSS custom properties defined in `index.css`. The landing page is one scrollable page; auth pages are centered card layouts. After login, users land on `/dashboard` (a placeholder until Stage 4).

**Tech Stack:** React 18, React Router v6, Vite 5, pure CSS (no UI library), fetch API for backend calls

---

## File Map

```
frontend/
├── index.html                    ← already exists — no changes needed
├── src/
│   ├── main.jsx                  ← already exists — no changes needed
│   ├── index.css                 ← NEW: global CSS variables + resets + shared styles
│   ├── App.jsx                   ← REPLACE: wire up React Router with all routes
│   ├── context/
│   │   └── AuthContext.jsx       ← NEW: JWT in memory, login/logout, useAuth hook
│   ├── pages/
│   │   ├── LandingPage.jsx       ← NEW: full landing page (nav, hero+login, features, pricing, footer)
│   │   ├── LoginPage.jsx         ← NEW: /login standalone page
│   │   ├── SignupPage.jsx        ← NEW: /signup page
│   │   ├── ForgotPasswordPage.jsx← NEW: /reset-password (request form)
│   │   ├── ResetPasswordPage.jsx ← NEW: /reset-password/:token (new password form)
│   │   ├── VerifyEmailPage.jsx   ← NEW: /verify-email/:token (auto-verifies on mount)
│   │   └── DashboardPage.jsx     ← NEW: /dashboard placeholder (Stage 4 will replace)
│   └── components/
│       └── ProtectedRoute.jsx    ← NEW: redirects to /login if not authenticated
```

---

## Task 1: Global CSS + App.jsx routing shell

**Files:**
- Create: `frontend/src/index.css`
- Replace: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1.1: Create `frontend/src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0b0d12;
  --surface: #11141c;
  --s2: #181c27;
  --s3: #1f2333;
  --s4: #262b3d;
  --border: #252a3a;
  --border2: #313752;
  --accent: #5b7fff;
  --accent2: #7c9bff;
  --aglow: rgba(91,127,255,.28);
  --text: #e8eaf2;
  --text2: #8b90a8;
  --text3: #4e546e;
  --green: #3ddcaa;
  --yellow: #f5a623;
  --purple: #a78bfa;
  --red: #ff5b6e;
  --r: 12px;
  --t: .17s cubic-bezier(.4,0,.2,1);
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

button { cursor: pointer; font-family: inherit; }

input, button, select, textarea { font-family: inherit; }

/* ── Shared form styles ── */
.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 13px; }
.field label { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text2); text-transform: uppercase; letter-spacing: .07em; }
.field input {
  background: var(--s2); border: 1px solid var(--border2); border-radius: 8px;
  color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px;
  padding: 9px 12px; outline: none; transition: border-color var(--t); width: 100%;
}
.field input:focus { border-color: var(--accent); }
.field input::placeholder { color: var(--text3); }

/* ── Shared button styles ── */
.btn-primary {
  background: var(--accent); border: none; border-radius: 8px; color: #fff;
  font-size: 14px; font-weight: 700; padding: 10px 20px; transition: all var(--t); width: 100%;
}
.btn-primary:hover { background: var(--accent2); box-shadow: 0 4px 18px var(--aglow); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }

.btn-ghost {
  background: transparent; border: 1px solid var(--border2); border-radius: 8px;
  color: var(--text2); font-size: 13px; font-weight: 600; padding: 7px 18px;
  transition: all var(--t);
}
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

/* ── Auth card (shared by login/signup/forgot/reset pages) ── */
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.auth-card {
  background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r);
  padding: 32px; width: 100%; max-width: 420px;
  box-shadow: 0 24px 64px rgba(0,0,0,.6);
}
.auth-logo {
  width: 40px; height: 40px; background: linear-gradient(135deg, var(--accent), var(--purple));
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 20px;
}
.auth-title { font-size: 20px; font-weight: 800; margin-bottom: 4px; letter-spacing: -.4px; }
.auth-sub { font-size: 12px; color: var(--text3); font-family: 'DM Mono', monospace; margin-bottom: 24px; }
.auth-footer { text-align: center; font-size: 12px; color: var(--text3); font-family: 'DM Mono', monospace; margin-top: 18px; }
.auth-footer a { color: var(--accent2); }
.auth-footer a:hover { text-decoration: underline; }
.auth-error { background: rgba(255,91,110,.1); border: 1px solid rgba(255,91,110,.3); border-radius: 8px; color: var(--red); font-size: 12px; font-family: 'DM Mono', monospace; padding: 10px 12px; margin-bottom: 14px; }
.auth-success { background: rgba(61,220,170,.1); border: 1px solid rgba(61,220,170,.3); border-radius: 8px; color: var(--green); font-size: 12px; font-family: 'DM Mono', monospace; padding: 10px 12px; margin-bottom: 14px; }
```

- [ ] **Step 1.2: Replace `frontend/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 1.3: Update `frontend/src/main.jsx` to import index.css**

The current main.jsx does not import index.css. Replace it with:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

(No change needed — index.css is already imported in App.jsx via `import './index.css'`)

- [ ] **Step 1.4: Verify dev server starts without errors**

```bash
cd frontend && npm run dev
```

Expected: Vite starts on port 5173. Browser console should show React error about missing modules (LandingPage etc.) — that's expected since the files don't exist yet. The shell is wired.

- [ ] **Step 1.5: Commit**

```bash
git add frontend/src/index.css frontend/src/App.jsx
git commit -m "feat: add global CSS and React Router shell"
```

---

## Task 2: AuthContext — JWT in memory

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`

- [ ] **Step 2.1: Create `frontend/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)

  const login = useCallback((token, userData) => {
    setAccessToken(token)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch { /* ignore network errors on logout */ }
    setAccessToken(null)
    setUser(null)
  }, [])

  // Attempt to restore session using refresh token cookie on app load
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // Fetch user info with the new token
        const meRes = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
          credentials: 'include',
        })
        if (meRes.ok) {
          const meData = await meRes.json()
          setAccessToken(data.accessToken)
          setUser(meData.user)
          return true
        }
      }
    } catch { /* no valid refresh token */ }
    return false
  }, [])

  return (
    <AuthContext.Provider value={{ accessToken, user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 2.2: Create `frontend/src/components/ProtectedRoute.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { accessToken, refresh } = useAuth()
  const [checking, setChecking] = useState(!accessToken)

  useEffect(() => {
    if (!accessToken) {
      refresh().finally(() => setChecking(false))
    }
  }, [accessToken, refresh])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  if (!accessToken) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 2.3: Commit**

```bash
git add frontend/src/context/AuthContext.jsx frontend/src/components/ProtectedRoute.jsx
git commit -m "feat: add AuthContext with JWT in memory and ProtectedRoute"
```

---

## Task 3: DashboardPage placeholder

**Files:**
- Create: `frontend/src/pages/DashboardPage.jsx`

- [ ] **Step 3.1: Create `frontend/src/pages/DashboardPage.jsx`**

```jsx
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
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat: add dashboard placeholder page"
```

---

## Task 4: LoginPage

**Files:**
- Create: `frontend/src/pages/LoginPage.jsx`

- [ ] **Step 4.1: Create `frontend/src/pages/LoginPage.jsx`**

```jsx
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
      login(data.accessToken, data.user)
      navigate('/dashboard')
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
```

- [ ] **Step 4.2: Commit**

```bash
git add frontend/src/pages/LoginPage.jsx
git commit -m "feat: add login page"
```

---

## Task 5: SignupPage

**Files:**
- Create: `frontend/src/pages/SignupPage.jsx`

- [ ] **Step 5.1: Create `frontend/src/pages/SignupPage.jsx`**

```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }
      setSuccess(data.message)
      setEmail('')
      setPassword('')
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
        <div className="auth-title">Create account</div>
        <div className="auth-sub">Start your CloudDesktop Workspace — free forever</div>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </div>
            <div className="field">
              <label>Password <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(min 8 characters)</span></label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: Commit**

```bash
git add frontend/src/pages/SignupPage.jsx
git commit -m "feat: add signup page"
```

---

## Task 6: ForgotPasswordPage + ResetPasswordPage + VerifyEmailPage

**Files:**
- Create: `frontend/src/pages/ForgotPasswordPage.jsx`
- Create: `frontend/src/pages/ResetPasswordPage.jsx`
- Create: `frontend/src/pages/VerifyEmailPage.jsx`

- [ ] **Step 6.1: Create `frontend/src/pages/ForgotPasswordPage.jsx`**

```jsx
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
```

- [ ] **Step 6.2: Create `frontend/src/pages/ResetPasswordPage.jsx`**

```jsx
import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Reset failed. The link may have expired.')
        return
      }
      navigate('/login?reset=1')
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
        <div className="auth-title">New password</div>
        <div className="auth-sub">Choose a strong password for your account</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>New password <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(min 8 chars)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoFocus />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Set new password →'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login">← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.3: Create `frontend/src/pages/VerifyEmailPage.jsx`**

```jsx
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
        <div className="auth-logo" style={{ margin: '0 auto 20px' }}>CW</div>
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
```

- [ ] **Step 6.4: Commit**

```bash
git add frontend/src/pages/ForgotPasswordPage.jsx frontend/src/pages/ResetPasswordPage.jsx frontend/src/pages/VerifyEmailPage.jsx
git commit -m "feat: add forgot/reset password and email verify pages"
```

---

## Task 7: LandingPage — nav + hero with login card

**Files:**
- Create: `frontend/src/pages/LandingPage.jsx` (nav + hero section only)

- [ ] **Step 7.1: Create `frontend/src/pages/LandingPage.jsx`** with nav and hero

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── inline styles as JS objects for colocation ── */
const S = {
  nav: {
    display: 'flex', alignItems: 'center', padding: '0 48px', height: 64,
    background: 'rgba(11,13,18,.9)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 800, letterSpacing: '-.4px' },
  navLogoIcon: {
    width: 32, height: 32, background: 'linear-gradient(135deg,var(--accent),var(--purple))',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800, color: '#fff',
  },
  navLinks: { display: 'flex', gap: 28, marginLeft: 36 },
  navLink: { color: 'var(--text2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  navRight: { marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' },
  hero: {
    display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48,
    alignItems: 'center', padding: '72px 48px 60px', maxWidth: 1200, margin: '0 auto',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--s2)', border: '1px solid var(--border2)',
    borderRadius: 20, padding: '4px 14px', fontSize: 11,
    fontFamily: "'DM Mono', monospace", color: 'var(--accent2)', marginBottom: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' },
  heroTitle: { fontSize: 50, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 16 },
  heroTitleSpan: { background: 'linear-gradient(135deg,var(--accent),var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub: { fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 460, marginBottom: 28, fontFamily: "'DM Mono', monospace" },
  heroCta: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  btnBig: {
    background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff',
    fontSize: 15, fontWeight: 700, padding: '12px 28px', transition: 'all var(--t)',
  },
  heroNote: { fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", marginTop: 12 },
  loginCard: {
    background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16,
    padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.6)',
  },
  loginCardTitle: { fontSize: 17, fontWeight: 800, marginBottom: 4 },
  loginCardSub: { fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", marginBottom: 20 },
  forgotLink: { textAlign: 'right', fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--accent2)', marginTop: -6, marginBottom: 12, display: 'block' },
  divider: { textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", margin: '14px 0' },
  loginFooter: { textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", marginTop: 16 },
}

function HeroLoginCard() {
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
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      login(data.accessToken, data.user)
      navigate('/dashboard')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={S.loginCard}>
      <div style={S.loginCardTitle}>Sign in to your hub</div>
      <div style={S.loginCardSub}>Access your workspace instantly</div>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></div>
        <Link to="/reset-password" style={S.forgotLink}>Forgot password?</Link>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in →'}</button>
      </form>
      <div style={S.divider}>— or —</div>
      <div style={S.loginFooter}>Don't have an account? <Link to="/signup" style={{ color: 'var(--accent2)' }}>Sign up free</Link></div>
    </div>
  )
}

export default function LandingPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navLogoIcon}>CW</div>
          CloudDesktop Workspace
        </div>
        <div style={S.navLinks}>
          <a href="#features" style={S.navLink}>Features</a>
          <a href="#pricing" style={S.navLink}>Pricing</a>
        </div>
        <div style={S.navRight}>
          {accessToken ? (
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Open workspace →</button>
          ) : (
            <>
              <Link to="/login"><button className="btn-ghost">Log in</button></Link>
              <Link to="/signup"><button className="btn-primary" style={{ padding: '7px 20px', fontSize: 13, width: 'auto' }}>Get started free</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div>
          <div style={S.badge}><span style={S.badgeDot}></span> Now with live news feeds</div>
          <h1 style={S.heroTitle}>Your entire<br /><span style={S.heroTitleSpan}>workspace,</span><br />one place.</h1>
          <p style={S.heroSub}>Launch all your web apps — Gmail, Notion, Slack, Drive and more — from a single hub. Stay logged into everything simultaneously.</p>
          <div style={S.heroCta}>
            <Link to="/signup"><button style={S.btnBig}>Start for free →</button></Link>
            <a href="#features"><button className="btn-ghost">See features</button></a>
          </div>
          <p style={S.heroNote}>No credit card required · Free forever plan available</p>
        </div>
        <HeroLoginCard />
      </section>

      {/* FEATURES, PRICING, FOOTER added in Task 8 */}
    </div>
  )
}
```

- [ ] **Step 7.2: Test in browser**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` — should show the nav and hero section with login card. Check:
- Logo and nav links visible
- Hero headline with gradient text renders
- Login card on the right with email/password fields
- No console errors

- [ ] **Step 7.3: Commit**

```bash
git add frontend/src/pages/LandingPage.jsx
git commit -m "feat: add landing page nav and hero with login card"
```

---

## Task 8: LandingPage — features, pricing, footer sections

**Files:**
- Modify: `frontend/src/pages/LandingPage.jsx`

- [ ] **Step 8.1: Replace `frontend/src/pages/LandingPage.jsx`** with complete version including all sections

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const S = {
  nav: { display:'flex', alignItems:'center', padding:'0 48px', height:64, background:'rgba(11,13,18,.9)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(12px)' },
  navLogo: { display:'flex', alignItems:'center', gap:10, fontSize:17, fontWeight:800, letterSpacing:'-.4px' },
  navLogoIcon: { width:32, height:32, background:'linear-gradient(135deg,var(--accent),var(--purple))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff' },
  navLinks: { display:'flex', gap:28, marginLeft:36 },
  navLink: { color:'var(--text2)', fontSize:13, fontWeight:600, textDecoration:'none' },
  navRight: { marginLeft:'auto', display:'flex', gap:10, alignItems:'center' },
  hero: { display:'grid', gridTemplateColumns:'1fr 380px', gap:48, alignItems:'center', padding:'72px 48px 60px', maxWidth:1200, margin:'0 auto' },
  badge: { display:'inline-flex', alignItems:'center', gap:6, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:20, padding:'4px 14px', fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', marginBottom:20 },
  badgeDot: { width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' },
  heroTitle: { fontSize:50, fontWeight:800, lineHeight:1.1, letterSpacing:'-2px', marginBottom:16 },
  heroTitleSpan: { background:'linear-gradient(135deg,var(--accent),var(--purple))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  heroSub: { fontSize:15, color:'var(--text2)', lineHeight:1.7, maxWidth:460, marginBottom:28, fontFamily:"'DM Mono',monospace" },
  heroCta: { display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' },
  btnBig: { background:'var(--accent)', border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, padding:'12px 28px', transition:'all var(--t)', cursor:'pointer' },
  heroNote: { fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:12 },
  loginCard: { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:28, boxShadow:'0 24px 64px rgba(0,0,0,.6)' },
  forgotLink: { textAlign:'right', fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', marginTop:-6, marginBottom:12, display:'block' },
  divider: { textAlign:'center', fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", margin:'14px 0' },
  section: { padding:'60px 48px', maxWidth:1200, margin:'0 auto' },
  sectionLabel: { fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:10 },
  sectionTitle: { fontSize:34, fontWeight:800, letterSpacing:'-1px', marginBottom:8 },
  sectionSub: { fontSize:14, color:'var(--text2)', fontFamily:"'DM Mono',monospace", marginBottom:40 },
  featGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 },
  featCard: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:22 },
  featIcon: { width:42, height:42, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:14 },
  featTitle: { fontSize:14, fontWeight:700, marginBottom:6 },
  featDesc: { fontSize:12, color:'var(--text2)', fontFamily:"'DM Mono',monospace", lineHeight:1.6 },
  pricingGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:36 },
  planCard: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, position:'relative' },
  planCardFeatured: { border:'1px solid var(--accent)', boxShadow:'0 0 0 1px var(--accent),0 8px 32px var(--aglow)' },
  planBadge: { position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'var(--accent)', color:'#fff', fontSize:10, fontWeight:700, fontFamily:"'DM Mono',monospace", padding:'3px 14px', borderRadius:20, whiteSpace:'nowrap' },
  planName: { fontSize:14, fontWeight:700, color:'var(--text2)', marginBottom:8 },
  planPrice: { fontSize:36, fontWeight:800, letterSpacing:'-2px', marginBottom:4 },
  planAnnual: { fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--green)', marginBottom:20 },
  planFeatures: { listStyle:'none', display:'flex', flexDirection:'column', gap:9, marginBottom:24 },
  planFeatureItem: { fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--text2)', display:'flex', alignItems:'center', gap:8 },
  planFeatureOff: { color:'var(--text3)' },
  footer: { borderTop:'1px solid var(--border)', padding:'32px 48px', maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' },
  footerText: { fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" },
  footerLink: { color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:11, textDecoration:'none', marginLeft:20 },
}

const FEATURES = [
  { icon:'🚀', bg:'rgba(91,127,255,.13)', title:'App Launcher', desc:'Open Gmail, Notion, Slack and 100+ apps in named browser tabs. Click again to focus — no duplicates.' },
  { icon:'📰', bg:'rgba(61,220,170,.13)', title:'Live News Feed', desc:'CNN, BBC, ESPN, TechCrunch and more — fetched fresh with images. Add any RSS source. Filter by outlet.' },
  { icon:'🗂️', bg:'rgba(167,139,250,.13)', title:'App Groups', desc:'Organize apps into color-coded groups. Drag to reorder. Right-click to edit anything.' },
  { icon:'⌨️', bg:'rgba(245,166,35,.13)', title:'Keyboard Shortcuts', desc:'Assign a global shortcut to any app. Press Ctrl+Shift+G to jump to Gmail instantly.' },
  { icon:'🔒', bg:'rgba(255,91,110,.13)', title:'Private by Design', desc:'Your settings are encrypted in your browser before touching the server. We store a blob we cannot read.' },
  { icon:'☁️', bg:'rgba(56,189,248,.13)', title:'Cloud Sync', desc:'Premium users get encrypted sync across all devices. Import/export as JSON anytime.' },
]

const FREE_FEATURES = [
  { text:'Up to 2 groups', on:true },
  { text:'Up to 10 apps', on:true },
  { text:'3 news sources', on:true },
  { text:'2 custom tabs', on:true },
  { text:'Local settings only', on:true },
  { text:'Cloud sync', on:false },
  { text:'Custom themes', on:false },
]

const PRO_FEATURES = [
  { text:'Unlimited groups', on:true },
  { text:'Unlimited apps', on:true },
  { text:'Unlimited news sources', on:true },
  { text:'Unlimited custom tabs', on:true },
  { text:'Encrypted cloud sync', on:true },
  { text:'Custom themes', on:true },
  { text:'Priority support', on:true },
]

const ENT_FEATURES = [
  { text:'Everything in Premium', on:true },
  { text:'Admin panel', on:true },
  { text:'User management', on:true },
  { text:'Usage analytics', on:true },
  { text:'SLA guarantee', on:true },
  { text:'Dedicated support', on:true },
  { text:'Custom domain', on:true },
]

function PlanFeature({ text, on }) {
  return (
    <li style={{ ...S.planFeatureItem, ...(on ? {} : S.planFeatureOff) }}>
      <span style={{ color: on ? 'var(--green)' : 'var(--text3)', fontWeight:700 }}>{on ? '✓' : '✗'}</span>
      {text}
    </li>
  )
}

function HeroLoginCard() {
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
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      login(data.accessToken, data.user)
      navigate('/dashboard')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={S.loginCard}>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>Sign in to your hub</div>
      <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20 }}>Access your workspace instantly</div>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></div>
        <Link to="/reset-password" style={S.forgotLink}>Forgot password?</Link>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in →'}</button>
      </form>
      <div style={S.divider}>— or —</div>
      <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
        Don't have an account? <Link to="/signup" style={{ color:'var(--accent2)' }}>Sign up free</Link>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLogo}><div style={S.navLogoIcon}>CW</div>CloudDesktop Workspace</div>
        <div style={S.navLinks}>
          <a href="#features" style={S.navLink}>Features</a>
          <a href="#pricing" style={S.navLink}>Pricing</a>
        </div>
        <div style={S.navRight}>
          {accessToken ? (
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Open workspace →</button>
          ) : (
            <>
              <Link to="/login"><button className="btn-ghost">Log in</button></Link>
              <Link to="/signup"><button className="btn-primary" style={{ padding:'7px 20px', fontSize:13, width:'auto' }}>Get started free</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div>
          <div style={S.badge}><span style={S.badgeDot}></span> Now with live news feeds</div>
          <h1 style={S.heroTitle}>Your entire<br /><span style={S.heroTitleSpan}>workspace,</span><br />one place.</h1>
          <p style={S.heroSub}>Launch all your web apps — Gmail, Notion, Slack, Drive and more — from a single hub. Stay logged into everything simultaneously.</p>
          <div style={S.heroCta}>
            <Link to="/signup"><button style={S.btnBig}>Start for free →</button></Link>
            <a href="#features"><button className="btn-ghost">See features</button></a>
          </div>
          <p style={S.heroNote}>No credit card required · Free forever plan available</p>
        </div>
        <HeroLoginCard />
      </section>

      {/* FEATURES */}
      <section id="features" style={S.section}>
        <div style={S.sectionLabel}>Everything you need</div>
        <h2 style={S.sectionTitle}>One hub. Every tool.</h2>
        <p style={S.sectionSub}>Built for people who live inside their browser all day.</p>
        <div style={S.featGrid}>
          {FEATURES.map(f => (
            <div key={f.title} style={S.featCard}>
              <div style={{ ...S.featIcon, background: f.bg }}>{f.icon}</div>
              <div style={S.featTitle}>{f.title}</div>
              <div style={S.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={S.section}>
        <div style={{ textAlign:'center' }}>
          <div style={S.sectionLabel}>Simple pricing</div>
          <h2 style={S.sectionTitle}>Start free. Upgrade when ready.</h2>
          <p style={S.sectionSub}>No hidden fees. Cancel anytime.</p>
        </div>
        <div style={S.pricingGrid}>
          {/* FREE */}
          <div style={S.planCard}>
            <div style={S.planName}>Free</div>
            <div style={S.planPrice}>$0 <span style={{ fontSize:14, fontWeight:400, color:'var(--text2)' }}>/&nbsp;month</span></div>
            <div style={{ ...S.planAnnual, color:'var(--text3)' }}>Free forever</div>
            <ul style={S.planFeatures}>{FREE_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <Link to="/signup"><button className="btn-ghost" style={{ width:'100%', padding:10, fontSize:13 }}>Get started free</button></Link>
          </div>
          {/* PREMIUM */}
          <div style={{ ...S.planCard, ...S.planCardFeatured }}>
            <div style={S.planBadge}>Most Popular</div>
            <div style={S.planName}>Premium</div>
            <div style={S.planPrice}>$4.99 <span style={{ fontSize:14, fontWeight:400, color:'var(--text2)' }}>/&nbsp;month</span></div>
            <div style={S.planAnnual}>or $39.99/year — save 33%</div>
            <ul style={S.planFeatures}>{PRO_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <Link to="/signup"><button className="btn-primary" style={{ fontSize:13 }}>Start free trial →</button></Link>
          </div>
          {/* ENTERPRISE */}
          <div style={S.planCard}>
            <div style={S.planName}>Enterprise</div>
            <div style={{ ...S.planPrice, fontSize:24 }}>Contact us</div>
            <div style={{ ...S.planAnnual, color:'var(--text3)' }}>Custom pricing</div>
            <ul style={S.planFeatures}>{ENT_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <button className="btn-ghost" style={{ width:'100%', padding:10, fontSize:13 }}>Contact sales →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <footer style={S.footer}>
          <p style={S.footerText}>© 2026 CloudDesktop Workspace · clouddesktop.infoplay.com</p>
          <div>
            <a href="#" style={S.footerLink}>Privacy</a>
            <a href="#" style={S.footerLink}>Terms</a>
            <a href="mailto:support@clouddesktop.infoplay.com" style={S.footerLink}>Contact</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
```

- [ ] **Step 8.2: Test the full page in browser**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` and verify:
- Scroll through: nav → hero → features (6 cards) → pricing (3 tiers) → footer
- Login card works (try logging in if backend dev server is running)
- `/login`, `/signup`, `/reset-password` routes load their pages
- `/dashboard` redirects to `/login` when not authenticated

- [ ] **Step 8.3: Build for production to confirm no errors**

```bash
npm run build
```

Expected: Build completes with no errors. Output in `../backend/public/`.

- [ ] **Step 8.4: Commit and push**

```bash
git add frontend/src/pages/LandingPage.jsx
git commit -m "feat: complete landing page with features, pricing, and footer"
git push origin main
```

---

## Task 9: Deploy and verify on production

- [ ] **Step 9.1: GitHub Actions deploys automatically on push**

Check `https://github.com/richardgamarra/clouddesktop/actions` — wait for green ✓

- [ ] **Step 9.2: Fix the deploy script to handle git stash**

The deploy script currently fails if the server has local modifications. Update `scripts/deploy.sh` locally:

```bash
#!/bin/bash
set -e

DEPLOY_DIR="/var/www/clouddesktop"
echo "=== CloudDesktop Deploy: $(date) ==="

cd "$DEPLOY_DIR"

echo "--- Stashing any local server changes ---"
git stash || true

echo "--- Pulling latest code ---"
git pull origin main

echo "--- Installing backend dependencies ---"
cd "$DEPLOY_DIR/backend"
npm install --production

echo "--- Installing frontend dependencies ---"
cd "$DEPLOY_DIR/frontend"
npm install

echo "--- Building React frontend ---"
npm run build

echo "--- Restarting backend with PM2 ---"
cd "$DEPLOY_DIR/backend"
pm2 restart clouddesktop-api --update-env || pm2 start server.js --name clouddesktop-api

echo "--- Deploy complete ---"
pm2 status
```

- [ ] **Step 9.3: Commit the fixed deploy script**

```bash
cd .. # back to repo root
git add scripts/deploy.sh
git commit -m "fix: add git stash to deploy script to handle local server changes"
git push origin main
```

- [ ] **Step 9.4: Verify production after deploy**

Open `https://clouddesktop.infoplay.com` and check:
- [ ] Landing page loads with nav, hero, features, pricing, footer
- [ ] Login card in hero works (signs in successfully)
- [ ] `/signup` page creates an account
- [ ] `/login` standalone page works
- [ ] `/dashboard` redirects to `/login` when not authenticated
- [ ] After login, `/dashboard` shows logged-in user's email

---

## Stage 3 Complete

The full public-facing product is live:
- `https://clouddesktop.infoplay.com` — landing page with hero login, features, pricing
- `https://clouddesktop.infoplay.com/login` — standalone login
- `https://clouddesktop.infoplay.com/signup` — registration
- `https://clouddesktop.infoplay.com/reset-password` — forgot password
- `https://clouddesktop.infoplay.com/reset-password/:token` — set new password
- `https://clouddesktop.infoplay.com/verify-email/:token` — email verification
- `https://clouddesktop.infoplay.com/dashboard` — protected placeholder (Stage 4)

Next: **Stage 4 — Dashboard: migrate index.html to React components**

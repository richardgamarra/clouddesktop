# Stage 8: Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin panel with user management, site stats, and broadcast announcements — backend API + React frontend, admin-only access.

**Architecture:** A `requireAdmin` middleware chains after `requireAuth` to guard all `/api/admin/*` routes. The frontend adds an `AdminRoute` component that redirects non-admins to `/dashboard`. Admin pages live under `frontend/src/pages/admin/` and share a simple `AdminLayout` with a sidebar. The broadcast announcement is fetched by every logged-in user on dashboard load and shown as a dismissible banner.

**Tech Stack:** Node.js + Express, PostgreSQL (pg), React 18, React Router v6, existing `requireAuth` middleware, existing CSS design tokens

---

## File Map

```
backend/
├── middleware/
│   └── admin.js               ← NEW: requireAdmin (chains after requireAuth)
├── routes/
│   └── admin.js               ← NEW: GET /users, PUT /users/:id, GET /stats, POST /broadcast
└── server.js                  ← MODIFY: mount /api/admin router

frontend/src/
├── components/
│   └── AdminRoute.jsx         ← NEW: redirects non-admin to /dashboard
├── pages/
│   └── admin/
│       ├── AdminLayout.jsx    ← NEW: shared sidebar nav for admin pages
│       ├── UsersPage.jsx      ← NEW: /admin/users — user table with search/filter/edit
│       ├── StatsPage.jsx      ← NEW: /admin/stats — counts and recent signups
│       └── BroadcastPage.jsx  ← NEW: /admin/broadcast — create/clear announcement
├── components/
│   └── AnnouncementBanner.jsx ← NEW: dismissible banner shown on /dashboard
└── App.jsx                    ← MODIFY: add /admin/* routes
```

---

## Task 1: requireAdmin middleware + admin router skeleton

**Files:**
- Create: `backend/middleware/admin.js`
- Create: `backend/routes/admin.js`
- Modify: `backend/server.js`

- [ ] **Step 1.1: Create `backend/middleware/admin.js`**

```js
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = requireAdmin
```

- [ ] **Step 1.2: Create `backend/routes/admin.js`** (skeleton — endpoints filled in Tasks 2-4)

```js
const express      = require('express')
const pool         = require('../db/pool')
const requireAuth  = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')

const router = express.Router()

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin)

// Placeholder — real endpoints added in Tasks 2-4
router.get('/ping', (req, res) => res.json({ ok: true }))

module.exports = router
```

- [ ] **Step 1.3: Mount admin router in `backend/server.js`**

Add these two lines after the existing `app.use('/api/auth', authRouter)` line:

```js
const adminRouter  = require('./routes/admin')
app.use('/api/admin', adminRouter)
```

The full relevant section of server.js after the change:
```js
app.use('/api/auth', authRouter)

const adminRouter  = require('./routes/admin')
app.use('/api/admin', adminRouter)
```

- [ ] **Step 1.4: Verify the ping endpoint works**

Start backend locally (`cd backend && npm run dev`), then in another terminal:

```bash
# First get a token by logging in (if you have a local account)
# Or just verify the route exists and returns 401 without auth
curl -s http://localhost:4010/api/admin/ping
```

Expected: `{"error":"Missing authorization token"}` (401 — auth guard is working)

- [ ] **Step 1.5: Commit**

```bash
git add backend/middleware/admin.js backend/routes/admin.js backend/server.js
git commit -m "feat: add requireAdmin middleware and /api/admin router"
```

---

## Task 2: GET /api/admin/users + PUT /api/admin/users/:id

**Files:**
- Modify: `backend/routes/admin.js`

- [ ] **Step 2.1: Replace `backend/routes/admin.js`** with the full version including user endpoints:

```js
const express      = require('express')
const crypto       = require('crypto')
const pool         = require('../db/pool')
const requireAuth  = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const { hashPassword } = require('../lib/hash')
const { sendPasswordResetEmail } = require('../lib/email')

const router = express.Router()
router.use(requireAuth, requireAdmin)

// ── GET /api/admin/users ─────────────────────────────────────────────────────
// Query params: ?search=email&role=free|premium|admin&page=1&limit=25
router.get('/users', async (req, res) => {
  const { search = '', role = '', page = '1', limit = '25' } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)

  const conditions = []
  const values     = []
  let idx = 1

  if (search.trim()) {
    conditions.push(`email ILIKE $${idx}`)
    values.push('%' + search.trim() + '%')
    idx++
  }
  if (['free', 'premium', 'admin'].includes(role)) {
    conditions.push(`role = $${idx}`)
    values.push(role)
    idx++
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM users ${where}`, values)
    const total    = parseInt(countRes.rows[0].count)

    const usersRes = await pool.query(
      `SELECT id, email, role, email_verified, created_at, last_login_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, parseInt(limit), offset]
    )

    res.json({ users: usersRes.rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    console.error('admin/users error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── PUT /api/admin/users/:id ─────────────────────────────────────────────────
// Body: { action: 'set_role' | 'reset_password' | 'toggle_active', role?, active? }
router.put('/users/:id', async (req, res) => {
  const { id } = req.params
  const { action, role } = req.body || {}

  // Prevent admin from demoting themselves
  if (id === req.user.id && action === 'set_role' && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot change your own role' })
  }

  try {
    const userRes = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id])
    const user = userRes.rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (action === 'set_role') {
      if (!['free', 'premium', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id])
      return res.json({ message: `Role updated to ${role}` })
    }

    if (action === 'reset_password') {
      const resetToken   = crypto.randomBytes(32).toString('hex')
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000)
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
        [resetToken, resetExpires, id]
      )
      try { await sendPasswordResetEmail(user.email, resetToken) } catch (e) { console.error('email failed:', e.message) }
      return res.json({ message: 'Password reset email sent' })
    }

    if (action === 'toggle_verified') {
      await pool.query('UPDATE users SET email_verified = NOT email_verified WHERE id = $1', [id])
      return res.json({ message: 'Email verified status toggled' })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('admin/users/:id error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totals, byRole, verified, today, week, recent] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users'),
      pool.query("SELECT role, COUNT(*) AS count FROM users GROUP BY role"),
      pool.query('SELECT COUNT(*) AS count FROM users WHERE email_verified = true'),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL '1 day'"),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"),
      pool.query('SELECT id, email, role, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10'),
    ])

    const roleMap = {}
    byRole.rows.forEach(r => { roleMap[r.role] = parseInt(r.count) })

    res.json({
      totalUsers:     parseInt(totals.rows[0].total),
      byRole:         { free: roleMap.free || 0, premium: roleMap.premium || 0, admin: roleMap.admin || 0 },
      emailVerified:  parseInt(verified.rows[0].count),
      newToday:       parseInt(today.rows[0].count),
      newThisWeek:    parseInt(week.rows[0].count),
      recentSignups:  recent.rows,
    })
  } catch (err) {
    console.error('admin/stats error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/admin/broadcast ────────────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  const { message } = req.body || {}
  try {
    // Deactivate all existing announcements
    await pool.query('UPDATE announcements SET active = false')
    if (message && message.trim()) {
      await pool.query(
        'INSERT INTO announcements (message, active) VALUES ($1, true)',
        [message.trim()]
      )
    }
    res.json({ message: message ? 'Announcement published' : 'Announcement cleared' })
  } catch (err) {
    console.error('admin/broadcast error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/admin/broadcast ─────────────────────────────────────────────────
// Public-ish: any logged-in user can fetch the active announcement
// (used by dashboard to show the banner — requireAdmin NOT applied here)
router.get('/broadcast/active', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT message FROM announcements WHERE active = true ORDER BY created_at DESC LIMIT 1'
    )
    res.json({ announcement: result.rows[0]?.message || null })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
```

**Note:** `GET /api/admin/broadcast/active` uses only `requireAuth` (not `requireAdmin`) so all logged-in users can fetch it for the dashboard banner. The route is still mounted under `/api/admin` but Express applies middleware per-route, not just at router level.

- [ ] **Step 2.2: Fix the broadcast active route — it must bypass requireAdmin**

The `router.use(requireAuth, requireAdmin)` applies to ALL routes. To make `/broadcast/active` only require auth (not admin), define it on the raw `express.Router()` before the middleware line, or handle it in a separate mini-router.

Replace the router setup at the top of `backend/routes/admin.js` with this pattern:

```js
const router = express.Router()

// Public (auth only) routes — must be defined BEFORE router.use(requireAdmin)
router.get('/broadcast/active', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT message FROM announcements WHERE active = true ORDER BY created_at DESC LIMIT 1'
    )
    res.json({ announcement: result.rows[0]?.message || null })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// All routes below require admin
router.use(requireAuth, requireAdmin)

// ... rest of admin routes (users, stats, broadcast POST)
```

The complete corrected file for `backend/routes/admin.js`:

```js
const express      = require('express')
const crypto       = require('crypto')
const pool         = require('../db/pool')
const requireAuth  = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const { sendPasswordResetEmail } = require('../lib/email')

const router = express.Router()

// ── Auth-only (no admin required) ────────────────────────────────────────────
router.get('/broadcast/active', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT message FROM announcements WHERE active = true ORDER BY created_at DESC LIMIT 1'
    )
    res.json({ announcement: result.rows[0]?.message || null })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.use(requireAuth, requireAdmin)

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { search = '', role = '', page = '1', limit = '25' } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  const conditions = [], values = []
  let idx = 1
  if (search.trim()) { conditions.push(`email ILIKE $${idx}`); values.push('%' + search.trim() + '%'); idx++ }
  if (['free', 'premium', 'admin'].includes(role)) { conditions.push(`role = $${idx}`); values.push(role); idx++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM users ${where}`, values)
    const total    = parseInt(countRes.rows[0].count)
    const usersRes = await pool.query(
      `SELECT id, email, role, email_verified, created_at, last_login_at FROM users ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, parseInt(limit), offset]
    )
    res.json({ users: usersRes.rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    console.error('admin/users error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const { id } = req.params
  const { action, role } = req.body || {}
  if (id === req.user.id && action === 'set_role' && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot change your own role' })
  }
  try {
    const userRes = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id])
    const user = userRes.rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (action === 'set_role') {
      if (!['free', 'premium', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id])
      return res.json({ message: `Role updated to ${role}` })
    }
    if (action === 'reset_password') {
      const resetToken   = crypto.randomBytes(32).toString('hex')
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000)
      await pool.query('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3', [resetToken, resetExpires, id])
      try { await sendPasswordResetEmail(user.email, resetToken) } catch (e) { console.error('email failed:', e.message) }
      return res.json({ message: 'Password reset email sent' })
    }
    if (action === 'toggle_verified') {
      await pool.query('UPDATE users SET email_verified = NOT email_verified WHERE id = $1', [id])
      return res.json({ message: 'Email verified status toggled' })
    }
    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('admin/users/:id error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totals, byRole, verified, today, week, recent] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users'),
      pool.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role'),
      pool.query('SELECT COUNT(*) AS count FROM users WHERE email_verified = true'),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL '1 day'"),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"),
      pool.query('SELECT id, email, role, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10'),
    ])
    const roleMap = {}
    byRole.rows.forEach(r => { roleMap[r.role] = parseInt(r.count) })
    res.json({
      totalUsers:    parseInt(totals.rows[0].total),
      byRole:        { free: roleMap.free || 0, premium: roleMap.premium || 0, admin: roleMap.admin || 0 },
      emailVerified: parseInt(verified.rows[0].count),
      newToday:      parseInt(today.rows[0].count),
      newThisWeek:   parseInt(week.rows[0].count),
      recentSignups: recent.rows,
    })
  } catch (err) {
    console.error('admin/stats error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/admin/broadcast
router.post('/broadcast', async (req, res) => {
  const { message } = req.body || {}
  try {
    await pool.query('UPDATE announcements SET active = false')
    if (message && message.trim()) {
      await pool.query('INSERT INTO announcements (message, active) VALUES ($1, true)', [message.trim()])
    }
    res.json({ message: message ? 'Announcement published' : 'Announcement cleared' })
  } catch (err) {
    console.error('admin/broadcast error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
```

- [ ] **Step 2.3: Commit**

```bash
git add backend/routes/admin.js backend/middleware/admin.js
git commit -m "feat: add admin API endpoints (users, stats, broadcast)"
```

---

## Task 3: AdminRoute + AdminLayout + App.jsx wiring

**Files:**
- Create: `frontend/src/components/AdminRoute.jsx`
- Create: `frontend/src/pages/admin/AdminLayout.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 3.1: Create `frontend/src/components/AdminRoute.jsx`**

```jsx
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }) {
  const { user, accessToken } = useAuth()
  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
```

- [ ] **Step 3.2: Create `frontend/src/pages/admin/AdminLayout.jsx`**

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin/stats',     label: '📊 Stats'       },
  { to: '/admin/users',     label: '👥 Users'       },
  { to: '/admin/broadcast', label: '📢 Broadcast'   },
]

export default function AdminLayout({ children }) {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  async function handleLogout() { await logout(); navigate('/') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 200, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.3px' }}>⚙ Admin</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginTop: 2 }}>CloudDesktop Workspace</div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'block', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all .15s',
              background: isActive ? 'rgba(91,127,255,.13)' : 'transparent',
              color: isActive ? 'var(--accent2)' : 'var(--text2)',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <NavLink to="/dashboard" style={{ display: 'block', padding: '8px 12px', fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", textDecoration: 'none' }}>
            ← Back to app
          </NavLink>
          <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3.3: Add admin routes to `frontend/src/App.jsx`**

Add these imports after the existing imports:
```jsx
import AdminRoute from './components/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import UsersPage from './pages/admin/UsersPage'
import StatsPage from './pages/admin/StatsPage'
import BroadcastPage from './pages/admin/BroadcastPage'
```

Add these routes inside `<Routes>` before the `<Route path="*" ...>` catch-all:
```jsx
<Route path="/admin" element={<AdminRoute><AdminLayout><StatsPage /></AdminLayout></AdminRoute>} />
<Route path="/admin/stats" element={<AdminRoute><AdminLayout><StatsPage /></AdminLayout></AdminRoute>} />
<Route path="/admin/users" element={<AdminRoute><AdminLayout><UsersPage /></AdminLayout></AdminRoute>} />
<Route path="/admin/broadcast" element={<AdminRoute><AdminLayout><BroadcastPage /></AdminLayout></AdminRoute>} />
```

- [ ] **Step 3.4: Commit**

```bash
git add frontend/src/components/AdminRoute.jsx frontend/src/pages/admin/AdminLayout.jsx frontend/src/App.jsx
git commit -m "feat: add AdminRoute, AdminLayout, and admin routes to App.jsx"
```

---

## Task 4: StatsPage

**Files:**
- Create: `frontend/src/pages/admin/StatsPage.jsx`

- [ ] **Step 4.1: Create `frontend/src/pages/admin/StatsPage.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: color || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function StatsPage() {
  const { accessToken } = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setStats(d); setLoading(false) })
      .catch(() => { setError('Failed to load stats'); setLoading(false) })
  }, [accessToken])

  if (loading) return <div style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>Loading…</div>
  if (error)   return <div style={{ color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{error}</div>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-.5px' }}>📊 Stats</h1>
      <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginBottom: 28 }}>Live counts from the database</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard label="Total Users"     value={stats.totalUsers}    color="var(--accent2)" />
        <StatCard label="Free"            value={stats.byRole.free}   />
        <StatCard label="Premium"         value={stats.byRole.premium} color="var(--green)" />
        <StatCard label="Admin"           value={stats.byRole.admin}  color="var(--purple)" />
        <StatCard label="Email Verified"  value={stats.emailVerified} sub={`${stats.totalUsers ? Math.round(stats.emailVerified / stats.totalUsers * 100) : 0}% of total`} />
        <StatCard label="New Today"       value={stats.newToday}      color="var(--yellow)" />
        <StatCard label="New This Week"   value={stats.newThisWeek}   />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>Recent Signups</div>
        {stats.recentSignups.length === 0 && (
          <div style={{ padding: '20px', color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>No users yet.</div>
        )}
        {stats.recentSignups.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{u.email}</div>
            <div style={{ background: u.role === 'admin' ? 'rgba(167,139,250,.13)' : u.role === 'premium' ? 'rgba(61,220,170,.13)' : 'rgba(91,127,255,.13)', color: u.role === 'admin' ? 'var(--purple)' : u.role === 'premium' ? 'var(--green)' : 'var(--accent2)', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{u.role}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>{formatDate(u.created_at)}</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.email_verified ? 'var(--green)' : 'var(--text3)' }} title={u.email_verified ? 'Email verified' : 'Not verified'} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4.2: Commit**

```bash
git add frontend/src/pages/admin/StatsPage.jsx
git commit -m "feat: add admin StatsPage"
```

---

## Task 5: UsersPage

**Files:**
- Create: `frontend/src/pages/admin/UsersPage.jsx`

- [ ] **Step 5.1: Create `frontend/src/pages/admin/UsersPage.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLE_COLORS = {
  admin:   { bg: 'rgba(167,139,250,.13)', color: 'var(--purple)' },
  premium: { bg: 'rgba(61,220,170,.13)',  color: 'var(--green)'  },
  free:    { bg: 'rgba(91,127,255,.13)',  color: 'var(--accent2)'},
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function UsersPage() {
  const { accessToken } = useAuth()
  const [users, setUsers]   = useState([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
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
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
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
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-.5px' }}>👥 Users</h1>
      <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginBottom: 24 }}>{total} total users</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search by email…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '8px 12px', outline: 'none', width: 260 }}
        />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '8px 12px', cursor: 'pointer', appearance: 'none' }}>
          <option value="">All roles</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {actionMsg && (
        <div style={{ background: 'rgba(61,220,170,.1)', border: '1px solid rgba(61,220,170,.3)', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontFamily: "'DM Mono',monospace", color: 'var(--green)', marginBottom: 14 }}>
          {actionMsg}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 110px 110px 180px', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, fontFamily: "'DM Mono',monospace", color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
          <span>Email</span><span>Role</span><span>Verified</span><span>Joined</span><span>Last login</span><span>Actions</span>
        </div>
        {loading && <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>Loading…</div>}
        {!loading && users.length === 0 && <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>No users found.</div>}
        {users.map(u => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 110px 110px 180px', padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
            <span>
              <select value={u.role} onChange={e => doAction(u.id, 'set_role', { role: e.target.value })}
                style={{ background: ROLE_COLORS[u.role]?.bg, color: ROLE_COLORS[u.role]?.color, border: 'none', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 700, cursor: 'pointer', appearance: 'none' }}>
                <option value="free">free</option>
                <option value="premium">premium</option>
                <option value="admin">admin</option>
              </select>
            </span>
            <span>
              <button onClick={() => doAction(u.id, 'toggle_verified')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                title={u.email_verified ? 'Click to unverify' : 'Click to verify'}>
                {u.email_verified ? '✅' : '❌'}
              </button>
            </span>
            <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)', fontSize: 11 }}>{formatDate(u.created_at)}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)', fontSize: 11 }}>{formatDate(u.last_login_at)}</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { if (window.confirm(`Send password reset to ${u.email}?`)) doAction(u.id, 'reset_password') }}
                style={{ background: 'var(--s3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text2)', fontSize: 10, fontFamily: "'DM Mono',monospace", padding: '3px 8px', cursor: 'pointer' }}>
                Reset pw
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text2)', fontSize: 12, fontFamily: "'DM Mono',monospace", padding: '5px 12px', cursor: 'pointer', opacity: page === 1 ? .4 : 1 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: 'var(--text3)' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text2)', fontSize: 12, fontFamily: "'DM Mono',monospace", padding: '5px 12px', cursor: 'pointer', opacity: page === totalPages ? .4 : 1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5.2: Commit**

```bash
git add frontend/src/pages/admin/UsersPage.jsx
git commit -m "feat: add admin UsersPage with search, filter, role change, reset password"
```

---

## Task 6: BroadcastPage + AnnouncementBanner

**Files:**
- Create: `frontend/src/pages/admin/BroadcastPage.jsx`
- Create: `frontend/src/components/AnnouncementBanner.jsx`
- Modify: `frontend/src/pages/DashboardPage.jsx`

- [ ] **Step 6.1: Create `frontend/src/pages/admin/BroadcastPage.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function BroadcastPage() {
  const { accessToken } = useAuth()
  const [message, setMessage]   = useState('')
  const [current, setCurrent]   = useState('')
  const [status, setStatus]     = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    fetch('/api/admin/broadcast/active', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.announcement) { setCurrent(d.announcement); setMessage(d.announcement) } })
  }, [accessToken])

  async function publish() {
    setLoading(true); setStatus('')
    const res  = await fetch('/api/admin/broadcast', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body:    JSON.stringify({ message }),
    })
    const data = await res.json()
    setStatus(data.message || data.error)
    if (res.ok) setCurrent(message)
    setLoading(false)
  }

  async function clear() {
    if (!window.confirm('Clear the current announcement?')) return
    setLoading(true); setStatus('')
    const res  = await fetch('/api/admin/broadcast', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body:    JSON.stringify({ message: '' }),
    })
    const data = await res.json()
    setStatus(data.message || data.error)
    if (res.ok) { setCurrent(''); setMessage('') }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-.5px' }}>📢 Broadcast</h1>
      <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginBottom: 28 }}>
        Post a message shown as a banner to all logged-in users on their dashboard.
      </p>

      {current && (
        <div style={{ background: 'rgba(91,127,255,.1)', border: '1px solid rgba(91,127,255,.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent2)', fontFamily: "'DM Mono',monospace" }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6, opacity: .7 }}>Current active announcement</div>
          {current}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>
          Message
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="e.g. We're performing maintenance on Sunday from 2–4 AM UTC."
          rows={4}
          style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '10px 12px', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {status && (
        <div style={{ background: 'rgba(61,220,170,.1)', border: '1px solid rgba(61,220,170,.3)', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontFamily: "'DM Mono',monospace", color: 'var(--green)', marginBottom: 14 }}>
          {status}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={publish} disabled={loading || !message.trim()}
          style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px 20px', cursor: 'pointer', opacity: (!message.trim() || loading) ? .5 : 1 }}>
          {loading ? 'Publishing…' : 'Publish →'}
        </button>
        {current && (
          <button onClick={clear} disabled={loading}
            style={{ background: 'transparent', border: '1px solid var(--red)', borderRadius: 8, color: 'var(--red)', fontSize: 13, fontWeight: 700, padding: '9px 16px', cursor: 'pointer' }}>
            Clear announcement
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6.2: Create `frontend/src/components/AnnouncementBanner.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AnnouncementBanner() {
  const { accessToken } = useAuth()
  const [message, setMessage]     = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/admin/broadcast/active', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.announcement) setMessage(d.announcement) })
      .catch(() => {})
  }, [accessToken])

  if (!message || dismissed) return null

  return (
    <div style={{
      background: 'rgba(91,127,255,.13)', borderBottom: '1px solid rgba(91,127,255,.3)',
      padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12,
      fontSize: 13, color: 'var(--accent2)', fontFamily: "'DM Mono',monospace",
    }}>
      <span style={{ fontSize: 16 }}>📢</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 6.3: Add AnnouncementBanner to `frontend/src/pages/DashboardPage.jsx`**

Add the import at the top of the file (after existing imports):
```jsx
import AnnouncementBanner from '../components/AnnouncementBanner'
```

Add the banner inside the `<div id="db-main">` div, immediately before `<div id="tabs-bar">`:
```jsx
<div id="db-main">
  <AnnouncementBanner />
  <div id="tabs-bar">
```

- [ ] **Step 6.4: Commit**

```bash
git add frontend/src/pages/admin/BroadcastPage.jsx frontend/src/components/AnnouncementBanner.jsx frontend/src/pages/DashboardPage.jsx
git commit -m "feat: add BroadcastPage and AnnouncementBanner for dashboard"
```

---

## Task 7: Build + push + production deploy

- [ ] **Step 7.1: Build frontend**

```bash
cd frontend && npm run build
```

Expected: Build succeeds, 65+ modules, no errors.

- [ ] **Step 7.2: Commit and push**

```bash
cd ..
git add -A
git commit -m "feat: Stage 8 admin panel complete"
git push origin main
```

- [ ] **Step 7.3: Deploy to production**

```bash
ssh -p 2222 root@clouddesktop.infoplay.com
cd /var/www/clouddesktop && git stash || true && git pull origin main
cd frontend && npm install && npm run build
cd ../backend && npm install --production && pm2 restart clouddesktop-api --update-env
```

- [ ] **Step 7.4: Create admin account**

```bash
# On the server, promote your account to admin
psql -h 127.0.0.1 -U clouddesktop_user -d clouddesktop -W
```
```sql
-- Replace with your actual email after signing up
UPDATE users SET role = 'admin', email_verified = true WHERE email = 'your@email.com';
\q
```

- [ ] **Step 7.5: Smoke test**

- [ ] `/admin` redirects non-admins to `/dashboard`
- [ ] `/admin/stats` shows user counts (all zeros if no users yet)
- [ ] `/admin/users` shows user table with search and role dropdown
- [ ] Changing a user's role via dropdown updates immediately
- [ ] `/admin/broadcast` posts a message → banner appears on `/dashboard`
- [ ] Dismissing the banner hides it
- [ ] Clearing the announcement removes the banner
- [ ] "← Back to app" link returns to `/dashboard`

---

## Stage 8 Complete

Admin panel is live at `https://clouddesktop.infoplay.com/admin`:
- `/admin/stats` — user counts by role, email verified rate, new today/week, recent signups
- `/admin/users` — paginated user table, search, filter by role, change role, toggle email verified, send password reset
- `/admin/broadcast` — publish/clear site-wide announcement banner
- All admin routes protected — non-admins redirected to `/dashboard`
- Announcement banner visible to all logged-in users, dismissible per session

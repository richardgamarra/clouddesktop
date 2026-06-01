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

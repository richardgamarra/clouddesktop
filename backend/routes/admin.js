const express      = require('express')
const pool         = require('../db/pool')
const requireAuth  = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')

const router = express.Router()

// Auth-only route (no admin required) - must be BEFORE router.use(requireAdmin)
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

// Placeholder ping
router.get('/ping', (req, res) => res.json({ ok: true }))

module.exports = router

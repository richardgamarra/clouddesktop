const express     = require('express')
const pool        = require('../db/pool')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/settings — returns {encrypted_blob, iv} or {encrypted_blob: null, iv: null}
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT encrypted_blob, iv FROM encrypted_settings WHERE user_id = $1',
      [req.user.id]
    )
    if (!result.rows.length) return res.json({ encrypted_blob: null, iv: null })
    res.json(result.rows[0])
  } catch (err) {
    console.error('settings GET error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/settings/sync — upserts encrypted blob
router.put('/sync', async (req, res) => {
  const { encrypted_blob, iv } = req.body || {}
  if (!encrypted_blob || !iv) {
    return res.status(400).json({ error: 'Missing encrypted_blob or iv' })
  }
  try {
    await pool.query(
      `INSERT INTO encrypted_settings (user_id, encrypted_blob, iv, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET encrypted_blob = $2, iv = $3, updated_at = NOW()`,
      [req.user.id, encrypted_blob, iv]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('settings PUT error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router

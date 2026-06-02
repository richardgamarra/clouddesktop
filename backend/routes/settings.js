const express     = require('express')
const pool        = require('../db/pool')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/settings
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

// PUT /api/settings/sync — upserts encrypted blob + saves backup (keeps last 5)
router.put('/sync', async (req, res) => {
  const { encrypted_blob, iv, label } = req.body || {}
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
    await pool.query(
      `INSERT INTO settings_backups (user_id, encrypted_blob, iv, label)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, encrypted_blob, iv, label || null]
    )
    await pool.query(
      `DELETE FROM settings_backups WHERE user_id = $1
       AND id NOT IN (
         SELECT id FROM settings_backups WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 5
       )`,
      [req.user.id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('settings PUT error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/settings/backups — list last 5 backups (metadata only)
router.get('/backups', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, label, created_at FROM settings_backups
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    )
    res.json({ backups: result.rows })
  } catch (err) {
    console.error('settings backups GET error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/settings/backups/:id — fetch a specific backup for restore
router.get('/backups/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT encrypted_blob, iv, label, created_at FROM settings_backups
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Backup not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('settings backup GET error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router

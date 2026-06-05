const express     = require('express')
const pool        = require('../db/pool')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/settings — returns plain JSON workspace
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT settings_json, encrypted_blob, iv FROM encrypted_settings WHERE user_id = $1',
      [req.user.id]
    )
    if (!result.rows.length) return res.json({ settings: null })
    const row = result.rows[0]
    // Return plain JSON if available, otherwise signal no data
    if (row.settings_json && Object.keys(row.settings_json).length > 0) {
      return res.json({ settings: row.settings_json })
    }
    res.json({ settings: null })
  } catch (err) {
    console.error('settings GET error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/settings/encrypted — raw encrypted blob for client-side migration
router.get('/encrypted', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT encrypted_blob, iv FROM encrypted_settings WHERE user_id = $1',
      [req.user.id]
    )
    if (!result.rows.length || !result.rows[0].encrypted_blob) {
      return res.json({ encrypted_blob: null, iv: null })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('settings encrypted GET error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/settings/sync — upserts plain JSON workspace + saves backup
router.put('/sync', async (req, res) => {
  const { settings, label } = req.body || {}
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Missing settings object' })
  }
  try {
    await pool.query(
      `INSERT INTO encrypted_settings (user_id, settings_json, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET settings_json = $2, updated_at = NOW()`,
      [req.user.id, settings]
    )
    // Save backup — encrypted_blob allows null via ALTER TABLE done earlier
    await pool.query(
      `INSERT INTO settings_backups (user_id, settings_json, label)
       VALUES ($1, $2, $3)`,
      [req.user.id, settings, label || null]
    ).catch(() => {
      // If encrypted_blob NOT NULL constraint still exists, skip backup silently
    })
    // Keep last 10 regular + all daily backups
    await pool.query(
      `DELETE FROM settings_backups WHERE user_id = $1
       AND (label IS NULL OR label NOT LIKE 'daily-%')
       AND id NOT IN (
         SELECT id FROM settings_backups
         WHERE user_id = $1 AND (label IS NULL OR label NOT LIKE 'daily-%')
         ORDER BY created_at DESC LIMIT 10
       )`,
      [req.user.id]
    ).catch(() => {})
    res.json({ ok: true })
  } catch (err) {
    console.error('settings PUT error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/settings/backups — list last 10 backups
router.get('/backups', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, label, created_at,
         CASE WHEN settings_json IS NOT NULL THEN 'json' ELSE 'encrypted' END as format,
         COALESCE(length(settings_json::text), length(encrypted_blob)) as bytes
       FROM settings_backups
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    )
    res.json({ backups: result.rows })
  } catch (err) {
    console.error('settings backups GET error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/settings/backups/:id — fetch a specific backup
router.get('/backups/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT settings_json, encrypted_blob, iv, label, created_at FROM settings_backups
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

// POST /api/settings/daily-backup
router.post('/daily-backup', async (req, res) => {
  try {
    const current = await pool.query(
      'SELECT settings_json FROM encrypted_settings WHERE user_id = $1',
      [req.user.id]
    )
    if (!current.rows.length || !current.rows[0].settings_json) {
      return res.json({ ok: true, skipped: 'no data' })
    }
    const { settings_json } = current.rows[0]
    const label = `daily-${new Date().toISOString().slice(0, 10)}`
    const existing = await pool.query(
      'SELECT id FROM settings_backups WHERE user_id=$1 AND label=$2',
      [req.user.id, label]
    )
    if (existing.rows.length) return res.json({ ok: true, skipped: 'already exists' })
    await pool.query(
      'INSERT INTO settings_backups (user_id, settings_json, label) VALUES ($1,$2,$3)',
      [req.user.id, settings_json, label]
    ).catch(() => {})
    res.json({ ok: true, label })
  } catch (err) {
    console.error('daily-backup error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router

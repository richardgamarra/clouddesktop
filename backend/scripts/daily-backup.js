#!/usr/bin/env node
// Daily backup script — runs via cron at 2am, creates labeled daily backup
// for every user that has been active in the last 7 days
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const { Pool } = require('pg')

const pool = new Pool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: String(process.env.DB_PASSWORD || process.env.DB_PASS),
})

async function run() {
  try {
    const users = await pool.query(
      `SELECT user_id, encrypted_blob, iv FROM encrypted_settings
       WHERE updated_at > NOW() - INTERVAL '7 days'
       AND length(encrypted_blob) > 100`
    )
    console.log(`[Daily Backup] ${new Date().toISOString()} — ${users.rows.length} active users`)

    const today = new Date().toISOString().slice(0, 10)
    const label = `daily-${today}`
    let created = 0, skipped = 0

    for (const row of users.rows) {
      // Skip if today's backup already exists
      const existing = await pool.query(
        'SELECT id FROM settings_backups WHERE user_id=$1 AND label=$2',
        [row.user_id, label]
      )
      if (existing.rows.length) { skipped++; continue }

      await pool.query(
        'INSERT INTO settings_backups (user_id, encrypted_blob, iv, label) VALUES ($1,$2,$3,$4)',
        [row.user_id, row.encrypted_blob, row.iv, label]
      )

      // Keep last 30 daily backups per user
      await pool.query(
        `DELETE FROM settings_backups WHERE user_id=$1 AND label LIKE 'daily-%'
         AND id NOT IN (
           SELECT id FROM settings_backups WHERE user_id=$1 AND label LIKE 'daily-%'
           ORDER BY created_at DESC LIMIT 30
         )`,
        [row.user_id]
      )
      created++
    }

    console.log(`[Daily Backup] Done — ${created} created, ${skipped} already had today's backup`)
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('[Daily Backup] FAILED:', err.message)
    await pool.end()
    process.exit(1)
  }
}

run()

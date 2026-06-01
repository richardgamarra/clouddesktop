require('dotenv').config()
const fs   = require('fs')
const path = require('path')
const pool = require('./pool')

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '002_auth_tokens.sql'), 'utf8')
  console.log('Running migration: 002_auth_tokens.sql ...')
  try {
    await pool.query(sql)
    console.log('Migration complete.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()

require('dotenv').config()
const fs   = require('fs')
const path = require('path')
const pool = require('./pool')

async function migrate() {
  const sqlPath = path.join(__dirname, 'migrations', '001_initial.sql')
  const sql     = fs.readFileSync(sqlPath, 'utf8')

  console.log('Running migration: 001_initial.sql ...')
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

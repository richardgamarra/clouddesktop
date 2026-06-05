require('dotenv').config()
const express      = require('express')
const helmet       = require('helmet')
const cors         = require('cors')
const cookieParser = require('cookie-parser')

const authRouter   = require('./routes/auth')
const adminRouter  = require('./routes/admin')
const requireAuth  = require('./middleware/auth')

const pool = require('./db/pool')
const app  = express()
const PORT = process.env.PORT || 4010

// One-time startup migration — drop NOT NULL on backup columns so plain-JSON
// backups can be inserted without providing the legacy encrypted_blob/iv fields
;(async () => {
  const alters = [
    `ALTER TABLE encrypted_settings ALTER COLUMN encrypted_blob DROP NOT NULL`,
    `ALTER TABLE encrypted_settings ALTER COLUMN iv DROP NOT NULL`,
    `ALTER TABLE settings_backups ALTER COLUMN encrypted_blob DROP NOT NULL`,
    `ALTER TABLE settings_backups ALTER COLUMN iv DROP NOT NULL`,
  ]
  for (const sql of alters) { try { await pool.query(sql) } catch {} }
})()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: process.env.APP_URL, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// ── Public API routes ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)

const newsRouter = require('./routes/news')
app.use('/api/news', newsRouter)

const settingsRouter = require('./routes/settings')
app.use('/api/settings', settingsRouter)

const iconsRouter = require('./routes/icons')
app.use('/api/icons', iconsRouter)

const stocksRouter = require('./routes/stocks')
app.use('/api/stocks', stocksRouter)

const uploadRouter = require('./routes/upload')
app.use('/api/upload', uploadRouter)

const radioRouter = require('./routes/radio')
app.use('/api/radio', radioRouter)

const jukeboxRouter = require('./routes/jukebox')
app.use('/api/jukebox', jukeboxRouter)

const stripeRouter = require('./routes/stripe')
app.use('/api/stripe', stripeRouter)

// Serve uploaded background images as static files
const uploadsDir = require('path').join(__dirname, '../uploads')
app.use('/uploads', require('express').static(uploadsDir))

// ── Protected API routes ──────────────────────────────────────────────────────
app.get('/api/user/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

// ── Serve React build ─────────────────────────────────────────────────────────
const publicDir = '/var/www/clouddesktop/backend/public'
const fs = require('fs')
if (fs.existsSync(publicDir + '/index.html')) {
  app.use(express.static(publicDir))
  app.get('*', (req, res) => res.sendFile(publicDir + '/index.html'))
}

app.listen(PORT, () => {
  console.log(`CloudDesktop backend running on port ${PORT} [${process.env.NODE_ENV}]`)
})

module.exports = app

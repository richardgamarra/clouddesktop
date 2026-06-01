require('dotenv').config()
const express = require('express')
const path    = require('path')
const helmet  = require('helmet')
const cors    = require('cors')
const cookieParser = require('cookie-parser')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Security middleware ──────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
}))
app.use(cors({
  origin: process.env.APP_URL,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// ── Health check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Serve React build (production) ───────────────────
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public')
  app.use(express.static(publicDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`CloudDesktop backend running on port ${PORT} [${process.env.NODE_ENV}]`)
})

module.exports = app

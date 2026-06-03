const express = require('express')
const http    = require('http')
const router  = express.Router()

const JUKEBOX_URL = 'http://localhost:3003'

// Proxy jukebox API — GET /api/jukebox/songs
router.get('/songs', async (req, res) => {
  try {
    const data = await fetch(`${JUKEBOX_URL}/api/playlists`)
    const json = await data.json()
    res.json(json)
  } catch (err) {
    res.status(502).json({ error: 'Jukebox unavailable', detail: err.message })
  }
})

module.exports = router

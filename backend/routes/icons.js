const express = require('express')
const https   = require('https')
const http    = require('http')

const router = express.Router()
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

// GET /api/icons/fetch?url=https://...
// Fetches a favicon URL and returns it as a base64 data URL
router.get('/fetch', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  // Only allow favicon-like URLs for security
  let parsed
  try { parsed = new URL(url) } catch { return res.status(400).json({ error: 'Invalid url' }) }

  const isHttps = parsed.protocol === 'https:'
  const mod     = isHttps ? https : http

  const request = mod.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CloudDesktop/1.0)',
      'Accept': 'image/*,*/*',
    },
    timeout: 6000,
    ...(isHttps ? { agent: httpsAgent } : {}),
  }, response => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      // Follow one redirect
      const redirectUrl = response.headers.location.startsWith('http')
        ? response.headers.location
        : `${parsed.origin}${response.headers.location}`
      return router.handle({ ...req, url: `/fetch?url=${encodeURIComponent(redirectUrl)}`, query: { url: redirectUrl } }, res, () => {})
    }
    if (response.statusCode !== 200) {
      return res.status(502).json({ error: `Upstream returned ${response.statusCode}` })
    }

    const contentType = response.headers['content-type'] || 'image/png'
    const chunks = []
    response.on('data', chunk => chunks.push(chunk))
    response.on('end', () => {
      const buffer = Buffer.concat(chunks)
      const base64 = buffer.toString('base64')
      // Normalize content type for data URL
      const mime = contentType.split(';')[0].trim() || 'image/png'
      res.json({ dataUrl: `data:${mime};base64,${base64}` })
    })
  })

  request.on('error', err => res.status(502).json({ error: err.message }))
  request.on('timeout', () => { request.destroy(); res.status(504).json({ error: 'Timeout' }) })
})

module.exports = router

const express = require('express')
const http    = require('http')
const https   = require('https')
const router  = express.Router()

// GET /api/radio/stream?url=ENCODED_URL
// Proxies an audio stream through the server to bypass CORS
router.get('/stream', (req, res) => {
  const targetUrl = req.query.url
  if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' })

  let url
  try { url = new URL(targetUrl) } catch { return res.status(400).json({ error: 'Invalid URL' }) }

  const protocol = url.protocol === 'https:' ? https : http
  const options = {
    hostname: url.hostname,
    port:     url.port || (url.protocol === 'https:' ? 443 : 80),
    path:     url.pathname + url.search,
    method:   'GET',
    headers: {
      'User-Agent':    'Mozilla/5.0 (compatible; RadioProxy/1.0)',
      'Icy-MetaData':  '0',
      'Accept':        '*/*',
      'Connection':    'keep-alive',
    },
    timeout: 10000,
  }

  const proxyReq = protocol.request(options, (proxyRes) => {
    // Forward audio headers
    const contentType = proxyRes.headers['content-type'] || 'audio/mpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Transfer-Encoding', 'chunked')

    // Handle redirects manually
    if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302 || proxyRes.statusCode === 303) {
      const location = proxyRes.headers.location
      if (location) {
        return res.redirect(`/api/radio/stream?url=${encodeURIComponent(location)}`)
      }
    }

    res.status(proxyRes.statusCode || 200)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    if (!res.headersSent) res.status(502).json({ error: 'Stream unavailable', detail: err.message })
  })

  proxyReq.setTimeout(10000, () => {
    proxyReq.destroy()
    if (!res.headersSent) res.status(504).json({ error: 'Stream timeout' })
  })

  // Stop proxy when client disconnects
  req.on('close', () => proxyReq.destroy())

  proxyReq.end()
})

module.exports = router

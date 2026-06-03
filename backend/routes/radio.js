const express = require('express')
const net     = require('net')
const tls     = require('tls')
const http    = require('http')
const https   = require('https')
const router  = express.Router()

// Proxy radio stream — handles both standard HTTP and ICY (SHOUTcast) protocol
router.get('/stream', (req, res) => {
  const targetUrl = req.query.url
  if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' })

  let url
  try { url = new URL(targetUrl) } catch { return res.status(400).json({ error: 'Invalid URL' }) }

  const isHttps = url.protocol === 'https:'
  const port    = url.port ? parseInt(url.port) : (isHttps ? 443 : 80)
  const host    = url.hostname
  const path    = (url.pathname || '/') + (url.search || '')

  // Set response headers immediately
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Transfer-Encoding', 'chunked')

  // Use raw TCP/TLS socket to support ICY protocol (SHOUTcast)
  // ICY servers respond with "ICY 200 OK" which Node's http module rejects
  const createSocket = () => isHttps
    ? tls.connect({ host, port, rejectUnauthorized: false })
    : net.connect({ host, port })

  const socket = createSocket()
  let headerDone = false
  let buffer = Buffer.alloc(0)

  socket.setTimeout(10000)

  socket.on('connect', () => {
    const req_headers = [
      `GET ${path} HTTP/1.0`,
      `Host: ${host}`,
      'User-Agent: Mozilla/5.0 (compatible; RadioProxy/1.0)',
      'Accept: */*',
      'Icy-MetaData: 0',
      'Connection: close',
      '',
      '',
    ].join('\r\n')
    socket.write(req_headers)
  })

  socket.on('data', (chunk) => {
    if (headerDone) {
      if (!res.writableEnded) res.write(chunk)
      return
    }

    buffer = Buffer.concat([buffer, chunk])
    const str = buffer.toString('binary')
    // Find end of headers (supports both HTTP and ICY)
    const headerEnd = str.indexOf('\r\n\r\n')
    if (headerEnd === -1) return // still receiving headers

    headerDone = true
    const headerStr = str.substring(0, headerEnd)

    // Check for redirect
    const locationMatch = headerStr.match(/[Ll]ocation:\s*(.+)/i)
    if (locationMatch && (headerStr.includes('301') || headerStr.includes('302'))) {
      socket.destroy()
      const newUrl = locationMatch[1].trim()
      return res.redirect(`/api/radio/stream?url=${encodeURIComponent(newUrl)}`)
    }

    // Extract content-type if present
    const ctMatch = headerStr.match(/[Cc]ontent-[Tt]ype:\s*([^\r\n]+)/i)
    if (ctMatch && !res.headersSent) {
      res.setHeader('Content-Type', ctMatch[1].trim())
    }

    if (!res.headersSent) res.status(200)

    // Send audio data after headers
    const audioStart = headerEnd + 4
    if (audioStart < buffer.length) {
      res.write(buffer.slice(audioStart))
    }
  })

  socket.on('error', (err) => {
    socket.destroy()
    if (!res.headersSent) res.status(502).json({ error: 'Stream unavailable', detail: err.message })
    else if (!res.writableEnded) res.end()
  })

  socket.on('timeout', () => {
    socket.destroy()
    if (!res.headersSent) res.status(504).json({ error: 'Stream timeout' })
    else if (!res.writableEnded) res.end()
  })

  socket.on('end', () => {
    if (!res.writableEnded) res.end()
  })

  req.on('close', () => socket.destroy())
})

module.exports = router

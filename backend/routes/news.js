const express = require('express')
const https   = require('https')
const http    = require('http')
const { DOMParser } = require('@xmldom/xmldom')

const router = express.Router()

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CloudDesktop/1.0; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      timeout: 8000,
      rejectUnauthorized: false,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      let data = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
}

function stripTags(s) { return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }

function extractImg(html) {
  const m = html.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i)
  return m ? m[1] : ''
}

function parseRSS(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const isAtom = !!doc.getElementsByTagName('feed').item(0)
  const itemTag = isAtom ? 'entry' : 'item'
  const items = doc.getElementsByTagName(itemTag)
  const results = []

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items.item(i)
    const txt = tag => {
      const el = item.getElementsByTagName(tag).item(0)
      return el?.textContent?.trim() || ''
    }
    const attr = (tag, a) => {
      const el = item.getElementsByTagName(tag).item(0)
      return el?.getAttribute(a) || ''
    }

    const title   = decodeEntities(txt('title'))
    const link    = attr('link', 'href') || txt('link') || txt('guid') || ''
    const rawDesc = txt('description') || txt('summary') || txt('content:encoded') || txt('content')
    const desc    = decodeEntities(stripTags(rawDesc)).slice(0, 220)
    const pubDate = txt('pubDate') || txt('published') || txt('updated') || ''
    const category = txt('category')

    let image = attr('enclosure', 'url') || attr('media:thumbnail', 'url') || attr('media:content', 'url') || extractImg(rawDesc) || ''

    if (title && link) results.push({ title, link, desc, image, pubDate, category })
  }
  return results
}

// GET /api/news/fetch?url=https://...
router.get('/fetch', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url param' })

  try {
    const xml = await fetchUrl(url)
    const items = parseRSS(xml)
    res.json({ items })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

module.exports = router

const express = require('express')
const router  = express.Router()

router.get('/', async (req, res) => {
  const symbolsParam = req.query.symbols || 'AAPL,TSLA,MSFT,GOOGL,AMZN'
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 20)

  const results = await Promise.all(symbols.map(async symbol => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      })
      if (!response.ok) return null
      const data = await response.json()
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta) return null
      return {
        symbol,
        name: meta.shortName || meta.longName || symbol,
        price: meta.regularMarketPrice || null,
        change: meta.regularMarketChangePercent || null,
      }
    } catch {
      return null
    }
  }))

  res.json(results)
})

module.exports = router

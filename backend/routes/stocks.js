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
      const price    = meta.regularMarketPrice || null
      const prevClose = meta.chartPreviousClose || meta.previousClose || null
      const changeAbs = meta.regularMarketChange || null
      let change = meta.regularMarketChangePercent || null
      // Calculate percent if not provided but we have price + previous close
      if (!change && price && prevClose && prevClose !== 0) {
        change = ((price - prevClose) / prevClose) * 100
      }
      // Or calculate from absolute change
      if (!change && price && changeAbs) {
        change = (changeAbs / (price - changeAbs)) * 100
      }
      return {
        symbol,
        name: meta.shortName || meta.longName || symbol,
        price,
        change: change !== null ? parseFloat(change.toFixed(2)) : null,
      }
    } catch {
      return null
    }
  }))

  res.json(results)
})

module.exports = router

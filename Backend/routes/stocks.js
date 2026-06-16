const express = require('express')

const router = express.Router()

const yahooSymbolMap = {
  RELIANCE: 'RELIANCE.NS',
  TCS: 'TCS.NS',
  HDFCBANK: 'HDFCBANK.NS',
  INFY: 'INFY.NS',
  ICICIBANK: 'ICICIBANK.NS',
  BAJFINANCE: 'BAJFINANCE.NS',
  LT: 'LT.NS',
  SUNPHARMA: 'SUNPHARMA.NS'
}

function getYahooSymbol(symbol) {
  const normalized = String(symbol || '').trim().toUpperCase()
  return yahooSymbolMap[normalized] || (normalized ? `${normalized}.NS` : '')
}

async function fetchYahooJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 StockSphere/1.0',
      Accept: 'application/json,text/plain,*/*'
    }
  })

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed with status ${response.status}`)
  }

  return response.json()
}

function formatQuote(item, requestedSymbol) {
  if (!item) {
    return null
  }

  const price = Number(item.regularMarketPrice ?? item.postMarketPrice ?? item.preMarketPrice)
  const change = Number(item.regularMarketChange ?? 0)
  const changePercent = Number(item.regularMarketChangePercent ?? 0)

  return {
    symbol: requestedSymbol,
    yahooSymbol: item.symbol || getYahooSymbol(requestedSymbol),
    name: item.longName || item.shortName || requestedSymbol,
    exchange: item.fullExchangeName || item.exchange || 'NSE',
    currency: item.currency || 'INR',
    price: Number.isFinite(price) ? Number(price.toFixed(2)) : null,
    change: Number.isFinite(change) ? Number(change.toFixed(2)) : null,
    changePercent: Number.isFinite(changePercent) ? Number(changePercent.toFixed(2)) : null,
    open: Number.isFinite(Number(item.regularMarketOpen)) ? Number(Number(item.regularMarketOpen).toFixed(2)) : null,
    high: Number.isFinite(Number(item.regularMarketDayHigh)) ? Number(Number(item.regularMarketDayHigh).toFixed(2)) : null,
    low: Number.isFinite(Number(item.regularMarketDayLow)) ? Number(Number(item.regularMarketDayLow).toFixed(2)) : null,
    volume: Number.isFinite(Number(item.regularMarketVolume)) ? Number(item.regularMarketVolume) : null,
    previousClose: Number.isFinite(Number(item.regularMarketPreviousClose)) ? Number(Number(item.regularMarketPreviousClose).toFixed(2)) : null,
    marketState: item.marketState || 'UNKNOWN',
    timestamp: item.regularMarketTime || null
  }
}

function parseCandles(payload, requestedSymbol) {
  const result = payload?.chart?.result?.[0]
  const quote = result?.indicators?.quote?.[0]
  const timestamps = result?.timestamp || []

  const candles = timestamps
    .map((timestamp, index) => {
      const open = quote?.open?.[index]
      const high = quote?.high?.[index]
      const low = quote?.low?.[index]
      const close = quote?.close?.[index]

      if (![open, high, low, close].every((value) => Number.isFinite(Number(value)))) {
        return null
      }

      return {
        time: timestamp,
        open: Number(Number(open).toFixed(2)),
        high: Number(Number(high).toFixed(2)),
        low: Number(Number(low).toFixed(2)),
        close: Number(Number(close).toFixed(2))
      }
    })
    .filter(Boolean)

  const meta = result?.meta || {}
  const lastCandle = candles[candles.length - 1]
  const lastClose = Number.isFinite(Number(lastCandle?.close)) ? Number(lastCandle.close) : null
  const previousClose = Number.isFinite(Number(meta.previousClose))
    ? Number(Number(meta.previousClose).toFixed(2))
    : Number.isFinite(Number(meta.chartPreviousClose))
      ? Number(Number(meta.chartPreviousClose).toFixed(2))
      : null

  const price = lastClose ?? previousClose ?? null
  const change = price !== null && previousClose !== null ? Number((price - previousClose).toFixed(2)) : null
  const changePercent = price !== null && previousClose !== null && previousClose !== 0
    ? Number((((price - previousClose) / previousClose) * 100).toFixed(2))
    : null

  return {
    symbol: requestedSymbol,
    yahooSymbol: meta.symbol || getYahooSymbol(requestedSymbol),
    name: meta.longName || meta.shortName || requestedSymbol,
    exchange: meta.exchangeName || meta.fullExchangeName || 'NSE',
    currency: meta.currency || 'INR',
    marketState: meta.marketState || 'UNKNOWN',
    previousClose,
    price,
    change,
    changePercent,
    open: Number.isFinite(Number(meta.regularMarketOpen)) ? Number(Number(meta.regularMarketOpen).toFixed(2)) : null,
    high: Number.isFinite(Number(meta.regularMarketDayHigh)) ? Number(Number(meta.regularMarketDayHigh).toFixed(2)) : null,
    low: Number.isFinite(Number(meta.regularMarketDayLow)) ? Number(Number(meta.regularMarketDayLow).toFixed(2)) : null,
    volume: Number.isFinite(Number(meta.regularMarketVolume)) ? Number(meta.regularMarketVolume) : null,
    candles
  }
}

router.get('/quotes', async (req, res) => {
  try {
    const symbols = String(req.query.symbols || '')
      .split(',')
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean)

    const requestedSymbols = symbols.length > 0
      ? symbols
      : Object.keys(yahooSymbolMap)

    const yahooSymbols = requestedSymbols
      .map((symbol) => getYahooSymbol(symbol))
      .filter(Boolean)

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols.join(','))}`
    const data = await fetchYahooJson(url)
    const quoteItems = data?.quoteResponse?.result || []

    const quotes = requestedSymbols.map((symbol) => {
      const yahooSymbol = getYahooSymbol(symbol)
      const item = quoteItems.find((quote) => quote.symbol === yahooSymbol)
      return formatQuote(item, symbol)
    }).filter(Boolean)

    res.json({ success: true, quotes })
  } catch (error) {
    console.error('[STOCKS ROUTES] QUOTES ERROR:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch Yahoo Finance quotes', error: error.message })
  }
})

router.get('/:symbol', async (req, res) => {
  try {
    const requestedSymbol = String(req.params.symbol || '').trim().toUpperCase()
    const range = String(req.query.range || '1d')
    const interval = String(req.query.interval || '1m')
    const yahooSymbol = getYahooSymbol(requestedSymbol)

    if (!requestedSymbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' })
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&includePrePost=false&events=div,splits`
    const data = await fetchYahooJson(url)
    const chart = parseCandles(data, requestedSymbol)

    res.json({ success: true, ...chart })
  } catch (error) {
    console.error('[STOCKS ROUTES] HISTORY ERROR:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch Yahoo Finance chart data', error: error.message })
  }
})

module.exports = router
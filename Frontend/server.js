const express = require('express')
const path = require('path')

const app = express()
const PORT = 3001

// Serve static files
app.use(express.static(path.join(__dirname, 'html')))
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use('/js', express.static(path.join(__dirname, 'js')))
app.use('/img', express.static(path.join(__dirname, 'img')))
app.use(express.json())

// Forward trade requests to backend
app.post('/api/trades/order', async (req, res) => {
  try {
    const backendResponse = await fetch('http://localhost:4002/api/trades/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })
    const data = await backendResponse.json()
    res.json(data)
  } catch (error) {
    console.error('[FRONTEND] Error forwarding trade order:', error)
    res.json({ success: false, message: 'Failed to place order', error: error.message })
  }
})

app.get('/api/trades/orders', async (req, res) => {
  try {
    const query = req.query.userId ? `?userId=${req.query.userId}` : ''
    const backendResponse = await fetch(`http://localhost:4002/api/trades/orders${query}`)
    const data = await backendResponse.json()
    res.json(data)
  } catch (error) {
    console.error('[FRONTEND] Error fetching orders:', error)
    res.json({ success: false, message: 'Failed to fetch orders', error: error.message })
  }
})

app.get('/api/trades/test', (req, res) => {
  res.json({ success: true, message: 'Frontend trade proxy working!' })
})

app.get('/api/stocks/quotes', async (req, res) => {
  try {
    const query = req.query.symbols ? `?symbols=${encodeURIComponent(req.query.symbols)}` : ''
    const backendResponse = await fetch(`http://localhost:4002/api/stocks/quotes${query}`)
    const data = await backendResponse.json()
    res.json(data)
  } catch (error) {
    console.error('[FRONTEND] Error fetching stock quotes:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch stock quotes', error: error.message })
  }
})

app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const params = new URLSearchParams()
    if (req.query.range) {
      params.set('range', req.query.range)
    }
    if (req.query.interval) {
      params.set('interval', req.query.interval)
    }

    const query = params.toString() ? `?${params.toString()}` : ''
    const backendResponse = await fetch(`http://localhost:4002/api/stocks/${encodeURIComponent(req.params.symbol)}${query}`)
    const data = await backendResponse.json()
    res.json(data)
  } catch (error) {
    console.error('[FRONTEND] Error fetching stock history:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch stock history', error: error.message })
  }
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Frontend server listening on http://localhost:${PORT}`)
})

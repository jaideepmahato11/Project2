const express = require('express')
const Trade = require('../models/Trade')

const router = express.Router()

function buildOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${randomStr}`
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Trade routes test endpoint working!' })
})

router.post('/order', async (req, res) => {
  try {
    console.log('[TRADES] POST /order called with:', req.body)
    const { symbol, side, quantity, price, orderType, transactionType, upiId, userId } = req.body

    if (!symbol || !side || !quantity || !price || !orderType || !transactionType || !upiId || !userId) {
      return res.json({ success: false, message: 'All order fields are required' })
    }

    const normalizedSide = String(side).toLowerCase()
    if (!['buy', 'sell'].includes(normalizedSide)) {
      return res.json({ success: false, message: 'Side must be buy or sell' })
    }

    const quantityNumber = Number(quantity)
    const priceNumber = Number(price)

    if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      return res.json({ success: false, message: 'Quantity must be a positive integer' })
    }

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      return res.json({ success: false, message: 'Price must be a positive number' })
    }

    if (typeof upiId !== 'string' || !upiId.includes('@')) {
      return res.json({ success: false, message: 'Valid UPI ID is required' })
    }

    const grossAmount = quantityNumber * priceNumber
    const charges = Number((grossAmount * 0.0015).toFixed(2))
    const settlementAmount = Number((grossAmount + charges).toFixed(2))

    const trade = new Trade({
      userId,
      symbol: String(symbol).toUpperCase(),
      side: normalizedSide,
      quantity: quantityNumber,
      price: Number(priceNumber.toFixed(2)),
      orderType,
      transactionType,
      grossAmount: Number(grossAmount.toFixed(2)),
      charges,
      settlementAmount,
      upiId,
      status: 'completed'
    })

    console.log('[TRADES] Saving trade to database:', trade)
    await trade.save()
    console.log('[TRADES] Trade saved successfully with ID:', trade._id)

    res.json({ 
      success: true, 
      message: 'Order placed and saved to database', 
      order: {
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        orderType: trade.orderType,
        transactionType: trade.transactionType,
        grossAmount: trade.grossAmount,
        charges: trade.charges,
        settlementAmount: trade.settlementAmount,
        upiId: trade.upiId,
        status: trade.status,
        createdAt: trade.createdAt
      }
    })
  } catch (error) {
    console.error('[TRADES ROUTES] ORDER ERROR:', error)
    res.json({ success: false, message: 'Failed to place order', error: error.message })
  }
})

router.get('/orders', async (req, res) => {
  try {
    const { userId } = req.query
    
    let query = {}
    if (userId) {
      query.userId = userId
    }
    
    const trades = await Trade.find(query).sort({ createdAt: -1 })
    res.json({ success: true, orders: trades })
  } catch (error) {
    console.error('[TRADES ROUTES] GET ORDERS ERROR:', error)
    res.json({ success: false, message: 'Failed to fetch orders', error: error.message })
  }
})

router.get('/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    const trades = await Trade.find({ userId }).sort({ createdAt: -1 })
    res.json({ success: true, orders: trades })
  } catch (error) {
    console.error('[TRADES ROUTES] GET USER ORDERS ERROR:', error)
    res.json({ success: false, message: 'Failed to fetch user orders', error: error.message })
  }
})

module.exports = router
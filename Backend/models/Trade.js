const mongoose = require('mongoose')

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  side: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    required: true
  },
  transactionType: {
    type: String,
    required: true
  },
  grossAmount: {
    type: Number,
    required: true
  },
  charges: {
    type: Number,
    required: true
  },
  settlementAmount: {
    type: Number,
    required: true
  },
  upiId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'completed',
    enum: ['pending', 'completed', 'cancelled']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Trade', tradeSchema)

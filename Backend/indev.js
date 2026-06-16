const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const path = require('path')
const cors = require('cors')

let authRoutes
let tradeRoutes
let stockRoutes
try {
  // Clear module cache for auth routes to ensure fresh load
  delete require.cache[require.resolve('./routes/auth')]
  authRoutes = require('./routes/auth')
  console.log('Auth routes imported successfully')
  delete require.cache[require.resolve('./routes/trades')]
  tradeRoutes = require('./routes/trades')
  console.log('Trade routes imported successfully')
  delete require.cache[require.resolve('./routes/stocks')]
  stockRoutes = require('./routes/stocks')
  console.log('Stock routes imported successfully')
} catch (error) {
  console.error('Error importing auth routes:', error)
  process.exit(1)
}


const app = express()
const envResult = dotenv.config({ path: path.join(__dirname, '.env') })

if (envResult.error) {
  console.error('Error loading .env:', envResult.error)
}

const port = process.env.PORT || 3000
const mongoUri = envResult.parsed?.MONGO_URI || process.env.MONGO_URI

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Log all requests
app.use((req, res, next) => {
  console.log(`[MIDDLEWARE] ${req.method} ${req.path}`)
  next()
})

//Database connection
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB')
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error)
    })
} else {
  console.warn('MONGO_URI is not set; skipping MongoDB connection')
}

// Routes
console.log('Loading auth routes...')
app.use('/api/auth', authRoutes)
console.log('Auth routes loaded successfully')

console.log('Loading trade routes...')
app.use('/api/trades', tradeRoutes)
console.log('Trade routes loaded successfully')

console.log('Loading stock routes...')
app.use('/api/stocks', stockRoutes)
console.log('Stock routes loaded successfully')

// Test endpoint 2
app.get('/api/test-direct', (req, res) => {
  res.json({ success: true, message: 'Direct test endpoint works!' })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ success: false, message: 'Server error', error: err.message })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

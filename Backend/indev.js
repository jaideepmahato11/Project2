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
const frontendUrl = envResult.parsed?.FRONTEND_URL || process.env.FRONTEND_URL
const allowedOrigins = [
  frontendUrl,
  'http://localhost:3001',
  'http://127.0.0.1:3001'
].filter(Boolean)

let mongoConnectionPromise = null
let lastMongoError = null
let lastMongoAttemptAt = null

async function ensureMongoConnection() {
  if (!mongoUri) {
    throw new Error('Database is not configured')
  }

  if (mongoose.connection.readyState === 1) {
    return
  }

  if (!mongoConnectionPromise) {
    console.log('[MONGO] Establishing MongoDB connection...')
    lastMongoAttemptAt = new Date().toISOString()
    mongoConnectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000
    })
      .then(() => {
        lastMongoError = null
        console.log('[MONGO] Connected to MongoDB')
      })
      .catch((error) => {
        lastMongoError = error && error.message ? error.message : String(error)
        console.error('[MONGO] Error connecting to MongoDB:', error && error.message ? error.message : error)
        mongoConnectionPromise = null
        throw error
      })
  }

  await mongoConnectionPromise

  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not ready')
  }
}

async function requireMongoConnection(req, res, next) {
  try {
    await ensureMongoConnection()
    next()
  } catch (error) {
    console.error('[MONGO] Request blocked until database was ready:', error.message)
    res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
      error: lastMongoError || error.message,
      lastMongoAttemptAt
    })
  }
}

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Log all requests
app.use((req, res, next) => {
  console.log(`[MIDDLEWARE] ${req.method} ${req.path}`)
  next()
})

//Database connection
//Database connection
if (mongoUri) {
  console.log('[MONGO] Connecting to MongoDB...')
  mongoConnectionPromise = ensureMongoConnection().catch((error) => {
    console.error('[MONGO] Initial connection failed:', error && error.message ? error.message : error)
  })

  mongoose.connection.on('error', (err) => {
    console.error('[MONGO] Connection error:', err && err.message ? err.message : err)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('[MONGO] Disconnected from MongoDB')
  })
} else {
  console.warn('[MONGO] MONGO_URI is not set; skipping MongoDB connection')
}

// Routes
console.log('Loading auth routes...')
app.use('/api/auth', requireMongoConnection, authRoutes)
console.log('Auth routes loaded successfully')

console.log('Loading trade routes...')
app.use('/api/trades', requireMongoConnection, tradeRoutes)
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

// Debug: MongoDB connection status (safe to expose temporarily for troubleshooting)
app.get('/api/debug/mongo', (req, res) => {
  try {
    const state = mongoose.connection.readyState // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    res.json({
      success: true,
      readyState: state,
      stateText: state === 0 ? 'disconnected' : state === 1 ? 'connected' : state === 2 ? 'connecting' : 'disconnecting'
    })
  } catch (err) {
    res.json({ success: false, message: err && err.message ? err.message : String(err) })
  }
})

app.get('/api/debug/config', (req, res) => {
  res.json({
    success: true,
    hasMongoUri: Boolean(mongoUri),
    hasFrontendUrl: Boolean(frontendUrl),
    vercel: process.env.VERCEL === '1' || process.env.VERCEL === 'true',
    lastMongoAttemptAt,
    mongoError: lastMongoError
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ success: false, message: 'Server error', error: err.message })
})

if (process.env.VERCEL !== '1' && process.env.VERCEL !== 'true') {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

app.get("/", (req, res) => {
  res.send("StockSphere Backend Running 🚀");
});

module.exports = app
const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

console.log('[AUTH ROUTES] Module loaded at', new Date().toISOString())

// Test endpoint
router.get('/test', (req, res) => {
  console.log('[AUTH ROUTES] GET /test called')
  res.json({ success: true, message: 'Auth routes test endpoint working!' })
})

// Signup
router.post('/signup', async (req, res) => {
  const timestamp = new Date().toISOString()
  console.log(`[AUTH ROUTES] POST /signup called at ${timestamp}`)
  console.log('[AUTH ROUTES] Request body:', req.body)
  
  try {
    const { fullName, email, password, confirmPassword } = req.body

    if (!fullName || !email || !password || !confirmPassword) {
      console.log('[AUTH ROUTES] Missing required fields')
      return res.json({ success: false, message: 'All fields are required' })
    }

    if (password !== confirmPassword) {
      console.log('[AUTH ROUTES] Passwords do not match')
      return res.json({ success: false, message: 'Passwords do not match' })
    }

    if (password.length < 6) {
      console.log('[AUTH ROUTES] Password too short')
      return res.json({ success: false, message: 'Password must be at least 6 characters' })
    }

    console.log('[AUTH ROUTES] Checking for existing user:', email)
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('[AUTH ROUTES] User already exists:', email)
      return res.json({ success: false, message: 'Email already registered' })
    }

    console.log('[AUTH ROUTES] Creating new user...')
    const newUser = new User({
      fullName,
      email,
      password
    })

    console.log('[AUTH ROUTES] Saving user to database...')
    await newUser.save()
    console.log('[AUTH ROUTES] User created successfully:', newUser._id)

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log('[AUTH ROUTES] Returning success response')
    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email
      }
    })
  } catch (error) {
    console.error('[AUTH ROUTES] SIGNUP ERROR:', error.message)
    console.error('[AUTH ROUTES] Error stack:', error.stack)
    res.json({ 
      success: false, 
      message: `ERROR: ${error.message}`,
      errorType: error.constructor.name
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.json({ success: false, message: 'Invalid email or password' })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.json({ success: false, message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.json({ success: false, message: 'An error occurred during login' })
  }
})

module.exports = router

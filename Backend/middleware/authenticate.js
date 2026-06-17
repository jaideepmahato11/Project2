const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || ''

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  if (typeof req.body?.token === 'string' && req.body.token.trim()) {
    return req.body.token.trim()
  }

  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim()
  }

  return ''
}

function authenticateUser(req, res, next) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return res.status(401).json({ success: false, message: 'Login required' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      token
    }

    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired login session', error: error.message })
  }
}

module.exports = authenticateUser
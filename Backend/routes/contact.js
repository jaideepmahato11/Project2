const express = require('express')
const ContactMessage = require('../models/ContactMessage')
const User = require('../models/User')
const authenticateUser = require('../middleware/authenticate')

const router = express.Router()

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Contact routes test endpoint working!' })
})

router.post('/messages', authenticateUser, async (req, res) => {
  try {
    const { fullName, email, message } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login required' })
    }

    const trimmedName = typeof fullName === 'string' ? fullName.trim() : ''
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const trimmedMessage = typeof message === 'string' ? message.trim() : ''

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' })
    }

    const user = await User.findById(userId).select('fullName email')

    if (!user) {
      return res.status(404).json({ success: false, message: 'Logged-in user not found' })
    }

    const contactMessage = new ContactMessage({
      userId,
      fullName: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage
    })

    await contactMessage.save()

    res.json({
      success: true,
      message: 'Your message has been saved',
      contactMessage: {
        id: contactMessage._id,
        fullName: contactMessage.fullName,
        email: contactMessage.email,
        message: contactMessage.message,
        createdAt: contactMessage.createdAt
      }
    })
  } catch (error) {
    console.error('[CONTACT ROUTES] MESSAGE ERROR:', error)
    res.status(500).json({ success: false, message: 'Failed to save contact message', error: error.message })
  }
})

router.get('/messages', authenticateUser, async (req, res) => {
  try {
    const messages = await ContactMessage.find({ userId: req.user.id }).sort({ createdAt: -1 })

    res.json({
      success: true,
      messages
    })
  } catch (error) {
    console.error('[CONTACT ROUTES] FETCH MESSAGES ERROR:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch contact messages', error: error.message })
  }
})

module.exports = router
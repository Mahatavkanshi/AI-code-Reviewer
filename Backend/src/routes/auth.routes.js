const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')

// Signup route (already exists)
router.post('/signup', authController.signup)

// ✅ Login route (new)
router.post('/login', authController.login)

module.exports = router
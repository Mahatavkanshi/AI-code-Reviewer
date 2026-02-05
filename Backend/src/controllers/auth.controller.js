const authService = require('../services/auth.service')

// Signup controller (no change needed)
exports.signup = async(req, res) => {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' })
        }

        const response = await authService.signup(username, email, password)
        if (!response.success) {
            return res.status(400).json(response)
        }

        res.status(201).json(response)
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// ✅ New Login controller
exports.login = async(req, res) => {
    try {
        const { usernameOrEmail, password } = req.body
        if (!usernameOrEmail || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' })
        }

        const response = await authService.login(usernameOrEmail, password)
        if (!response.success) {
            return res.status(401).json(response)
        }

        res.status(200).json(response)
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}
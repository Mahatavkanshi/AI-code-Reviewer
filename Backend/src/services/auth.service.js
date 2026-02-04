const pool = require('../../db')
const bcrypt = require('bcrypt')

// Hash password
async function hashPassword(password) {
    const saltRounds = 10
    return await bcrypt.hash(password, saltRounds)
}

// Signup function
async function signup(username, email, password) {
    // Check if username or email already exists
    const existing = await pool.query(
        'SELECT * FROM users WHERE username=$1 OR email=$2', [username, email]
    )

    if (existing.rows.length > 0) {
        return { success: false, message: 'Username or email already exists' }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const result = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at', [username, email, hashedPassword]
    )

    return { success: true, user: result.rows[0] }
}

module.exports = { signup }
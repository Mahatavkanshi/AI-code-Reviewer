const pool = require('../../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

// Hash password
async function hashPassword(password) {
    const saltRounds = 10
    return await bcrypt.hash(password, saltRounds)
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            role: user.role || 'user'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    )
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

// Login function
async function login(usernameOrEmail, password) {
    // Check for hardcoded admin credentials
    if (usernameOrEmail === '22040690@coer.ac.in' && password === 'sajal') {
        // Ensure admin exists in database
        const adminResult = await pool.query(
            'SELECT * FROM users WHERE email=$1', [usernameOrEmail]
        )
        
        let admin
        if (adminResult.rows.length === 0) {
            // Create admin if doesn't exist
            const hashedPassword = await hashPassword(password)
            const createResult = await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
                ['admin', usernameOrEmail, hashedPassword, 'admin']
            )
            admin = createResult.rows[0]
        } else {
            admin = adminResult.rows[0]
            // Ensure role is admin
            if (admin.role !== 'admin') {
                await pool.query('UPDATE users SET role=$1 WHERE id=$2', ['admin', admin.id])
                admin.role = 'admin'
            }
        }
        
        const token = generateToken(admin)
        return {
            success: true,
            token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                created_at: admin.created_at
            }
        }
    }
    
    // Find user by username OR email
    const result = await pool.query(
        'SELECT id, username, email, password, role, created_at FROM users WHERE username=$1 OR email=$1', 
        [usernameOrEmail]
    )

    if (result.rows.length === 0) {
        return { success: false, message: 'User not found' }
    }

    const user = result.rows[0]

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
        return { success: false, message: 'Incorrect password' }
    }

    // Login successful - generate token
    const token = generateToken(user)
    
    return {
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at
        }
    }
}

module.exports = { signup, login }
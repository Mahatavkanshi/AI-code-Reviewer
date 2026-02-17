const express = require('express')
const cors = require('cors')
const aiRoutes = require('./routes/ai.routes')
const authRoutes = require('./routes/auth.routes')
const githubRoutes = require('./routes/github.routes')
const reviewRoutes = require('./routes/review.routes')
const adminRoutes = require('./routes/admin.routes')

const app = express()

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(express.json())

// Test route
app.get('/', (req, res) => {
    res.send('hello world')
})

// Mount AI route
app.use('/ai', aiRoutes)

// Mount Auth route
app.use('/auth', authRoutes)

// Mount GitHub route
app.use('/github', githubRoutes)

// Mount Review route
app.use('/reviews', reviewRoutes)

// Mount Admin route
app.use('/admin', adminRoutes)

module.exports = app
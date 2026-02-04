const express = require('express')
const cors = require('cors')
const aiRoutes = require('./routes/ai.routes')
const authRoutes = require('./routes/auth.routes') // import the auth route

const app = express()

app.use(cors())
app.use(express.json())

// Test route
app.get('/', (req, res) => {
    res.send('hello world')
})

// Mount AI route
app.use('/ai', aiRoutes)

// Mount Auth route
app.use('/auth', authRoutes) // <--- added for login

module.exports = app
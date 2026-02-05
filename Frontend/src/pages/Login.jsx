import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const navigate = useNavigate()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { usernameOrEmail, password })
      if (response.data.success) {
        // Store a simple token for now
        localStorage.setItem('token', 'loggedin') 
        setMessage('Login successful! Redirecting to dashboard...')
        setTimeout(() => navigate('/dashboard'), 1000)
      } else {
        setMessage(response.data.message)
      }
    } catch (error) {
      console.error(error)
      setMessage('Login failed. Please try again.')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <h2>Login</h2>
        <input type="text" placeholder="Username or Email" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        {message && <p>{message}</p>}
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Don't have an account? <a href="/signup" style={{ color: '#0066cc', textDecoration: 'none' }}>Sign up</a>
        </p>
      </form>
    </div>
  )
}

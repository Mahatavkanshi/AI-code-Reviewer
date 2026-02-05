import { Routes, Route, Navigate } from 'react-router-dom'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
function App() {
  // Simple login check using localStorage
  const isLoggedIn = !!localStorage.getItem('token')

  return (
    <Routes>
      {/* Redirect / to dashboard if logged in, else login */}
      <Route path="/" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
      
      {/* Signup page */}
      <Route path="/signup" element={<Signup />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard / AI editor */}
      <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App

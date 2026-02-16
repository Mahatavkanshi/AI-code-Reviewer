import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthPage } from "@/components/AuthPage"
import { Dashboard } from "@/pages/Dashboard"
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token')
  })

  // Listen for storage changes (in case token is set in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'))
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-code-reviewer-theme">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage onLoginSuccess={handleLoginSuccess} />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" replace />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App

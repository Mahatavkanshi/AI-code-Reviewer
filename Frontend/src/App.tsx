import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthPage } from "@/components/AuthPage"
import { Dashboard } from "@/pages/Dashboard"
import { AdminDashboard } from "@/pages/AdminDashboard"
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token')
  })
  const [userRole, setUserRole] = useState<string | null>(() => {
    return localStorage.getItem('userRole')
  })

  // Listen for storage changes (in case token is set in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'))
      setUserRole(localStorage.getItem('userRole'))
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLoginSuccess = (role: string) => {
    setIsAuthenticated(true)
    setUserRole(role)
    localStorage.setItem('userRole', role)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    setIsAuthenticated(false)
    setUserRole(null)
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-code-reviewer-theme">
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? 
              (userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />) 
              : <AuthPage onLoginSuccess={handleLoginSuccess} />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated && userRole === 'user' ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/admin" 
            element={isAuthenticated && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App

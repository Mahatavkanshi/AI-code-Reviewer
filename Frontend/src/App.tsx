import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthPage } from "@/components/AuthPage"
import { Dashboard } from "@/pages/Dashboard"
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  const isAuthenticated = () => {
    return !!localStorage.getItem('token')
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-code-reviewer-theme">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated() ? <Navigate to="/dashboard" /> : <AuthPage />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated() ? <Dashboard /> : <Navigate to="/" />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App

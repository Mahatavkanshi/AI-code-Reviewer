import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { adminAPI } from "@/lib/api"
import { useTheme } from "@/components/theme-provider"
import { 
  Users, 
  FileCode, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  Code2,
  LogOut,
  UserPlus,
  Shield,
  Calendar,
  Moon,
  Sun,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}

interface Review {
  id: number
  user_id: number
  username: string
  email: string
  code_snippet: string
  language: string
  ai_review: string
  issues_count: number
  suggestions_count: number
  created_at: string
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [users, setUsers] = useState<User[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReviews: 0,
    todayReviews: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  })
  const [activeTab, setActiveTab] = useState<'users' | 'reviews'>('users')
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  // Theme settings
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || '#3b82f6'
  })
  const [wallpaper, setWallpaper] = useState<string | null>(() => {
    return localStorage.getItem('wallpaper')
  })
  const [wallpaperMode, setWallpaperMode] = useState<'cover' | 'contain' | 'repeat'>(() => {
    return (localStorage.getItem('wallpaperMode') as 'cover' | 'contain' | 'repeat') || 'cover'
  })
  const [wallpaperBlur, setWallpaperBlur] = useState(() => {
    return Number(localStorage.getItem('wallpaperBlur')) || 0
  })
  const [wallpaperOpacity, setWallpaperOpacity] = useState(() => {
    return Number(localStorage.getItem('wallpaperOpacity')) || 0.5
  })
  const [gradientTheme, setGradientTheme] = useState(() => {
    return localStorage.getItem('gradientTheme') || null
  })

  // Apply accent color and gradient theme on mount and when they change
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor)
    
    if (gradientTheme) {
      document.documentElement.style.setProperty('--gradient-theme', gradientTheme)
      document.body.style.background = gradientTheme
    } else {
      document.documentElement.style.removeProperty('--gradient-theme')
      document.body.style.background = ''
    }
  }, [accentColor, gradientTheme])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
      return
    }

    setLoading(true)
    try {
      const [usersRes, statsRes, reviewsRes] = await Promise.all([
        adminAPI.getUsers(token),
        adminAPI.getStats(token),
        adminAPI.getAllReviews(token)
      ])

      if (usersRes.success) setUsers(usersRes.users)
      if (statsRes.success) setStats(statsRes.stats)
      if (reviewsRes.success) setReviews(reviewsRes.reviews)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error('Please fill in all fields')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await adminAPI.createUser(newUser, token)
      if (response.success) {
        toast.success('User created successfully')
        setUsers([...users, response.user])
        setShowAddUser(false)
        setNewUser({ username: '', email: '', password: '', role: 'user' })
        loadData()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? All their reviews will also be deleted.')) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await adminAPI.deleteUser(userId, token)
      toast.success('User deleted successfully')
      setUsers(users.filter(u => u.id !== userId))
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleChangeRole = async (userId: number, newRole: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await adminAPI.changeUserRole(userId, newRole, token)
      toast.success(`User role changed to ${newRole}`)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error: any) {
      toast.error(error.message || 'Failed to change role')
    }
  }

  const handleResetDashboard = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await adminAPI.resetDashboard(token)
      toast.success(response.message)
      setShowResetConfirm(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset dashboard')
    }
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewUser({ ...newUser, password })
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: gradientTheme || undefined,
          backgroundColor: gradientTheme ? undefined : 'var(--background)'
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: gradientTheme || undefined,
        backgroundColor: gradientTheme ? undefined : 'var(--background)'
      }}
    >
      {/* Wallpaper Background */}
      {wallpaper && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${wallpaper})`,
              backgroundSize: wallpaperMode === 'repeat' ? 'auto' : wallpaperMode,
              backgroundPosition: 'center',
              backgroundRepeat: wallpaperMode === 'repeat' ? 'repeat' : 'no-repeat',
              opacity: 0.08,
              filter: `blur(${wallpaperBlur}px)`,
            }}
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Reviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayReviews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </Button>
            <Button
              variant={activeTab === 'reviews' ? 'default' : 'outline'}
              onClick={() => setActiveTab('reviews')}
            >
              <Code2 className="h-4 w-4 mr-2" />
              All Reviews ({reviews.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'users' && (
              <Button onClick={() => setShowAddUser(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={() => setShowResetConfirm(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reset Dashboard
            </Button>
          </div>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 text-sm">{user.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className="bg-background border rounded px-2 py-1 text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Table */}
        {activeTab === 'reviews' && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Language</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Issues</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Suggestions</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reviews.map((review) => (
                      <tr key={review.id}>
                        <td className="px-4 py-3 text-sm">{review.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{review.username}</td>
                        <td className="px-4 py-3 text-sm capitalize">{review.language || 'unknown'}</td>
                        <td className="px-4 py-3 text-sm">{review.issues_count}</td>
                        <td className="px-4 py-3 text-sm">{review.suggestions_count}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(review.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReview(review)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add User Dialog */}
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. You can set a password or generate a random one.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showNewUserPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Enter password or generate"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewUserPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button type="button" variant="outline" onClick={generateRandomPassword}>
                    Generate
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Reset Dashboard
              </DialogTitle>
              <DialogDescription>
                This will delete ALL users (except your admin account) and ALL their reviews. 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleResetDashboard}>
                Yes, Reset Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Detail Dialog */}
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
            </DialogHeader>
            
            {selectedReview && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User</label>
                    <p className="font-medium">{selectedReview.username} ({selectedReview.email})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Language</label>
                    <p className="font-medium capitalize">{selectedReview.language}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Code</label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    <code>{selectedReview.code_snippet}</code>
                  </pre>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">AI Review</label>
                  <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                    {selectedReview.ai_review}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
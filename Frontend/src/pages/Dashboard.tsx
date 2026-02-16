import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { aiAPI } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { CodeDiff } from "@/components/CodeDiff"
import { GitHubIntegration } from "@/components/GitHubIntegration"
import { GitHubRepos } from "@/components/GitHubRepos"
import { 
  Moon, 
  Sun, 
  LogOut, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  History,
  FileCode,
  Zap,
  Clock,
  ChevronRight,
  Settings,
  GitCompare,
  Eye,
  Github
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ReviewHistory {
  id: string
  language: string
  timestamp: Date
  issues: number
  suggestions: number
  fixApplied?: boolean
  codeSnippet?: string
}

export function Dashboard() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [review, setReview] = useState("")
  const [improvedCode, setImprovedCode] = useState("")
  const [viewMode, setViewMode] = useState<"review" | "diff">("review")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("review")
  const [sidebarOpen] = useState(true)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalSolutions: 0,
    avgIssues: 0,
    todayReviews: 0
  })

  // Mock data for charts (in real app, fetch from backend)
  const activityData = [
    { name: 'Mon', reviews: 4 },
    { name: 'Tue', reviews: 3 },
    { name: 'Wed', reviews: 7 },
    { name: 'Thu', reviews: 5 },
    { name: 'Fri', reviews: 8 },
    { name: 'Sat', reviews: 2 },
    { name: 'Sun', reviews: 3 },
  ]

  const languageData = [
    { name: 'JavaScript', value: 35, color: '#f7df1e' },
    { name: 'Python', value: 25, color: '#3776ab' },
    { name: 'TypeScript', value: 20, color: '#3178c6' },
    { name: 'Java', value: 12, color: '#b07219' },
    { name: 'Others', value: 8, color: '#6b7280' },
  ]

  const [recentReviews, setRecentReviews] = useState<ReviewHistory[]>([
    { id: '1', language: 'javascript', timestamp: new Date(Date.now() - 3600000), issues: 3, suggestions: 5 },
    { id: '2', language: 'python', timestamp: new Date(Date.now() - 7200000), issues: 1, suggestions: 2 },
    { id: '3', language: 'typescript', timestamp: new Date(Date.now() - 86400000), issues: 0, suggestions: 3 },
  ])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Please enter some code to review")
      return
    }

    setIsLoading(true)
    setError("")
    setReview("")
    setImprovedCode("")
    setViewMode("review")

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/')
        return
      }

      const response = await aiAPI.getReview({ code, language }, token)
      
      // Handle both old format (just review) and new format (review + improvedCode)
      if (response.review && typeof response.review === 'object') {
        setReview(response.review.review || response.review)
        setImprovedCode(response.review.improvedCode || code)
      } else {
        setReview(response.review || response)
        setImprovedCode(code)
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalReviews: prev.totalReviews + 1,
        totalSolutions: prev.totalSolutions + 1,
        todayReviews: prev.todayReviews + 1
      }))

      // Add to recent reviews
      const newReview: ReviewHistory = {
        id: Date.now().toString(),
        language,
        timestamp: new Date(),
        issues: 3,
        suggestions: 5,
        fixApplied: false,
        codeSnippet: code.slice(0, 200) + (code.length > 200 ? '...' : '')
      }
      setRecentReviews(prev => [newReview, ...prev.slice(0, 9)])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get review"
      
      if (errorMessage.includes('Rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
        setError(`${errorMessage}\n\n💡 Tip: Identical code submissions are cached for 5 minutes. Try again in a moment.`)
      } else {
        setError(errorMessage)
      }
      
      console.error("Review error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getLanguageIcon = (lang: string) => {
    const icons: Record<string, string> = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      cpp: '⚙️',
      csharp: '🔷',
      go: '🐹',
      rust: '⚙️'
    }
    return icons[lang] || '📝'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2 mr-4">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">AI Code Reviewer</span>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center space-x-2">
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
              
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 border-r bg-muted/40 min-h-[calc(100vh-3.5rem)] hidden md:block`}>
          <div className="p-4 space-y-2">
            <Button 
              variant={activeTab === "review" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("review")}
            >
              <Zap className="h-4 w-4" />
              {sidebarOpen && <span>New Review</span>}
            </Button>

            <Button 
              variant={activeTab === "history" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("history")}
            >
              <History className="h-4 w-4" />
              {sidebarOpen && <span>History</span>}
            </Button>

            <Button 
              variant={activeTab === "analytics" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3 className="h-4 w-4" />
              {sidebarOpen && <span>Analytics</span>}
            </Button>

            <Button 
              variant={activeTab === "github" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("github")}
            >
              <Github className="h-4 w-4" />
              {sidebarOpen && <span>GitHub</span>}
            </Button>

            <Button 
              variant={activeTab === "settings" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4" />
              {sidebarOpen && <span>Settings</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          {activeTab === "review" && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalReviews}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.todayReviews} today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Solutions Applied</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSolutions}</div>
                    <p className="text-xs text-muted-foreground">
                      Issues resolved
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Issues</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgIssues || 2.4}</div>
                    <p className="text-xs text-muted-foreground">
                      Per review
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Review Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.5s</div>
                    <p className="text-xs text-muted-foreground">
                      Avg response
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Code Review Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5" />
                      Your Code
                    </CardTitle>
                    <CardDescription>
                      Paste your code here for AI-powered review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Programming Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="javascript">🟨 JavaScript</option>
                        <option value="typescript">🔷 TypeScript</option>
                        <option value="python">🐍 Python</option>
                        <option value="java">☕ Java</option>
                        <option value="cpp">⚙️ C++</option>
                        <option value="csharp">🔷 C#</option>
                        <option value="go">🐹 Go</option>
                        <option value="rust">⚙️ Rust</option>
                      </select>
                    </div>
                    
                    <Textarea
                      placeholder="// Paste your code here...&#10;function example() {&#10;  // Your code here&#10;}"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="min-h-[350px] font-mono text-sm"
                    />
                    
                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{error}</p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleReview} 
                      className="w-full"
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <>🔄 Analyzing...</>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Get AI Review
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {review && (
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "review" | "diff")} className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <TabsList>
                          <TabsTrigger value="review" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Review
                          </TabsTrigger>
                          <TabsTrigger value="diff" className="flex items-center gap-2">
                            <GitCompare className="h-4 w-4" />
                            Diff View
                          </TabsTrigger>
                        </TabsList>
                        
                        {viewMode === "review" && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                              ✅ Review Complete
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <TabsContent value="review" className="mt-0">
                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              AI Review Analysis
                            </CardTitle>
                            <CardDescription>
                              Detailed code analysis and improvement suggestions
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                              <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[500px] border">
                                {review}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(review)}>
                                📋 Copy Review
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => {setReview(""); setImprovedCode("");}}>
                                🗑️ Clear
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="diff" className="mt-0">
                        {improvedCode && (
                          <CodeDiff 
                            oldCode={code} 
                            newCode={improvedCode}
                            onApplyFix={(fixedCode) => {
                              setCode(fixedCode);
                              setStats(prev => ({
                                ...prev,
                                totalSolutions: prev.totalSolutions + 1
                              }));
                              // Mark the most recent review as fixed
                              setRecentReviews(prev => {
                                if (prev.length === 0) return prev;
                                const updated = [...prev];
                                updated[0] = { ...updated[0], fixApplied: true };
                                return updated;
                              });
                            }}
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  )}

                  {!review && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          AI Review
                        </CardTitle>
                        <CardDescription>
                          AI-powered code review and suggestions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                          <div className="bg-muted rounded-full p-4 mb-4">
                            <Zap className="h-8 w-8 opacity-50" />
                          </div>
                          <p className="text-lg font-medium">Ready to Review</p>
                          <p className="text-sm max-w-sm text-center mt-2">
                            Submit your code to get an AI-powered review with side-by-side diff comparison
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Review History</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{recentReviews.filter(r => r.fixApplied).length} fixes applied</span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                {recentReviews.map((review) => (
                  <Card key={review.id} className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getLanguageIcon(review.language)}</span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium capitalize">{review.language} Review</p>
                              {review.fixApplied && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Fix Applied
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {review.timestamp.toLocaleString()}
                            </p>
                            {review.codeSnippet && (
                              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded mt-2 max-w-md truncate">
                                {review.codeSnippet}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                              {review.issues} issues
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {review.suggestions} suggestions
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {recentReviews.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews yet. Start by reviewing some code!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Analytics</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Activity</CardTitle>
                    <CardDescription>Code reviews over the past week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="reviews" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Languages</CardTitle>
                    <CardDescription>Distribution by programming language</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={languageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {languageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "github" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Github className="h-6 w-6" />
                  GitHub Integration
                </h2>
              </div>
              
              <div className="grid gap-6">
                <GitHubIntegration />
                <GitHubRepos />
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <h2 className="text-2xl font-bold">Settings</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the dashboard looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Theme</label>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred theme
                      </p>
                    </div>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="p-2 border rounded-md bg-background"
                    >
                      <option value="light">☀️ Light</option>
                      <option value="dark">🌙 Dark</option>
                      <option value="system">💻 System</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { aiAPI } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { CodeDiff } from "@/components/CodeDiff"
import { GitHubIntegration } from "@/components/GitHubIntegration"
import { GitHubRepos } from "@/components/GitHubRepos"
import { LocalFolderBrowser } from "@/components/LocalFolderBrowser"
import { AIReviewDisplay } from "@/components/AIReviewDisplay"
import { SystemSettings } from "@/components/SystemSettings"
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
  Github,
  FolderOpen,
  Monitor,
  Image as ImageIcon
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

// Comprehensive language list with icons
const LANGUAGES = [
  { value: "auto", label: "🔍 Auto Detect", icon: "🔍" },
  { value: "javascript", label: "🟨 JavaScript", icon: "🟨" },
  { value: "typescript", label: "🔷 TypeScript", icon: "🔷" },
  { value: "python", label: "🐍 Python", icon: "🐍" },
  { value: "java", label: "☕ Java", icon: "☕" },
  { value: "cpp", label: "⚙️ C++", icon: "⚙️" },
  { value: "c", label: "🔵 C", icon: "🔵" },
  { value: "csharp", label: "🔷 C#", icon: "🔷" },
  { value: "go", label: "🐹 Go", icon: "🐹" },
  { value: "rust", label: "⚙️ Rust", icon: "⚙️" },
  { value: "php", label: "🐘 PHP", icon: "🐘" },
  { value: "ruby", label: "💎 Ruby", icon: "💎" },
  { value: "swift", label: "🦉 Swift", icon: "🦉" },
  { value: "kotlin", label: "🟣 Kotlin", icon: "🟣" },
  { value: "scala", label: "🔴 Scala", icon: "🔴" },
  { value: "r", label: "📊 R", icon: "📊" },
  { value: "matlab", label: "📐 MATLAB", icon: "📐" },
  { value: "sql", label: "🗄️ SQL", icon: "🗄️" },
  { value: "bash", label: "🐚 Bash/Shell", icon: "🐚" },
  { value: "powershell", label: "💻 PowerShell", icon: "💻" },
  { value: "html", label: "🌐 HTML", icon: "🌐" },
  { value: "css", label: "🎨 CSS", icon: "🎨" },
  { value: "scss", label: "💅 SCSS/Sass", icon: "💅" },
  { value: "xml", label: "📄 XML", icon: "📄" },
  { value: "json", label: "📋 JSON", icon: "📋" },
  { value: "yaml", label: "📃 YAML", icon: "📃" },
  { value: "toml", label: "⚙️ TOML", icon: "⚙️" },
  { value: "markdown", label: "📝 Markdown", icon: "📝" },
  { value: "latex", label: "📚 LaTeX", icon: "📚" },
  { value: "dart", label: "🎯 Dart", icon: "🎯" },
  { value: "lua", label: "🌙 Lua", icon: "🌙" },
  { value: "perl", label: "🐪 Perl", icon: "🐪" },
  { value: "haskell", label: "λ Haskell", icon: "λ" },
  { value: "clojure", label: "λ Clojure", icon: "λ" },
  { value: "erlang", label: "📡 Erlang", icon: "📡" },
  { value: "elixir", label: "💧 Elixir", icon: "💧" },
  { value: "ocaml", label: "🐫 OCaml", icon: "🐫" },
  { value: "fsharp", label: "🔷 F#", icon: "🔷" },
  { value: "groovy", label: "🎸 Groovy", icon: "🎸" },
  { value: "objectivec", label: "🍎 Objective-C", icon: "🍎" },
  { value: "assembly", label: "🔧 Assembly", icon: "🔧" },
  { value: "fortran", label: "📐 Fortran", icon: "📐" },
  { value: "cobol", label: "📠 COBOL", icon: "📠" },
  { value: "vhdl", label: "🔌 VHDL", icon: "🔌" },
  { value: "verilog", label: "🔧 Verilog", icon: "🔧" },
  { value: "solidity", label: "💎 Solidity", icon: "💎" },
  { value: "vyper", label: "🐍 Vyper", icon: "🐍" },
  { value: "julia", label: "🔵 Julia", icon: "🔵" },
  { value: "crystal", label: "💎 Crystal", icon: "💎" },
  { value: "nim", label: "🦁 Nim", icon: "🦁" },
  { value: "zig", label: "⚡ Zig", icon: "⚡" },
  { value: "v", label: "✌️ V", icon: "✌️" },
  { value: "carbon", label: "🔶 Carbon", icon: "🔶" },
  { value: "apex", label: "☁️ Apex", icon: "☁️" },
  { value: "plsql", label: "🗄️ PL/SQL", icon: "🗄️" },
  { value: "tsql", label: "🗄️ T-SQL", icon: "🗄️" },
  { value: "abap", label: "📦 ABAP", icon: "📦" },
  { value: "sas", label: "📊 SAS", icon: "📊" },
  { value: "gams", label: "📊 GAMS", icon: "📊" },
  { value: "stata", label: "📈 Stata", icon: "📈" },
  { value: "arduino", label: "🔌 Arduino", icon: "🔌" },
  { value: "mbed", label: "🔧 Mbed", icon: "🔧" },
  { value: "platformio", label: "🔧 PlatformIO", icon: "🔧" },
  { value: "flutter", label: "💙 Flutter", icon: "💙" },
  { value: "react", label: "⚛️ React/JSX", icon: "⚛️" },
  { value: "vue", label: "💚 Vue", icon: "💚" },
  { value: "angular", label: "🅰️ Angular", icon: "🅰️" },
  { value: "svelte", label: "🧡 Svelte", icon: "🧡" },
  { value: "graphql", label: "◈ GraphQL", icon: "◈" },
  { value: "regex", label: "🔍 Regex", icon: "🔍" },
]

// Language detection patterns
const LANGUAGE_PATTERNS: { [key: string]: RegExp[] } = {
  javascript: [/\b(const|let|var|function|=>|console\.log)\b/, /\b(document|window|fetch|async|await)\b/],
  typescript: [/\b(interface|type|enum|namespace|declare)\b/, /:\s*(string|number|boolean|any)\b/],
  python: [/\b(def|class|import|from|if __name__ == ['"]__main__['"])\b/, /:\s*\n\s+/m],
  java: [/\b(public|private|protected|class|void|static)\s+\w+\s*\(/, /\b(System\.out\.println|public\s+static\s+void\s+main)\b/],
  cpp: [/\b(#include|using\s+namespace|cout|cin)\b/, /\b(int|void|char|double|float)\s+\w+\s*\(/],
  c: [/\b(#include|printf|scanf|malloc|free)\b/, /\b(int|void|char)\s+\w+\s*\([^)]*\)\s*\{/],
  csharp: [/\b(using\s+System|namespace|public\s+class|Console\.WriteLine)\b/, /\b(string|int|bool)\s+\w+\s*\{/],
  go: [/\b(package|func|import|fmt\.Println)\b/, /\b(func\s+\w+\s*\([^)]*\)\s*\w*\s*\{)/],
  rust: [/\b(fn|let\s+mut|use|impl|pub|struct|enum)\b/, /\b(Result|Option|Vec|String)\b/],
  php: [/\b(<\?php|\$\w+|echo|function)\b/, /\b(\$_GET|\$_POST|\$_SERVER)\b/],
  ruby: [/\b(def|end|puts|require|ruby)\b/, /\b(\w+:\s*.+|do\s*\|[^|]+\|)/],
  swift: [/\b(import|func|var|let|class|struct)\b/, /\b(print|UIKit|Foundation|SwiftUI)\b/],
  kotlin: [/\b(fun|val|var|class|object|interface)\b/, /\b(println|companion\s+object)\b/],
  html: [/<!DOCTYPE\s+html>|<html>|<head>|<body>/i, /<\w+[^>]*>/],
  css: [/\b([.#]\w+\s*\{|:hover|:active|@media)\b/, /\b(color|background|margin|padding|display)\s*:/],
  sql: [/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|TABLE|FROM|WHERE|JOIN)\b/i],
  bash: [/#!\/bin\/bash|#!\/bin\/sh/, /\b(echo|if|then|fi|for|do|done)\b/],
  json: [/^[\s]*\{[\s]*"/, /^[\s]*\[[\s]*"/],
  yaml: [/^\w+:\s*\n|^\s+-\s+\w+:/m, /\b(apiVersion|kind|metadata|spec)\b/],
  markdown: [/^#{1,6}\s+/, /\*\*|__|\[.*?\]\(.*?\)/],
}

// Detect language from code
function detectLanguage(code: string): string {
  if (!code || code.trim().length < 10) return "javascript"
  
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        return lang
      }
    }
  }
  
  // Default to javascript if no pattern matches
  return "javascript"
}

interface DashboardProps {
  onLogout?: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("auto")
  const [review, setReview] = useState("")
  const [improvedCode, setImprovedCode] = useState("")
  const [viewMode, setViewMode] = useState<"review" | "diff">("review")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("review")
  const [sidebarOpen] = useState(true)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  // System Settings State
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
  const [showSystemSettings, setShowSystemSettings] = useState(false)

  // Apply accent color on mount and when it changes
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor)
  }, [accentColor])

  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalSolutions: 0,
    avgIssues: 0,
    todayReviews: 0
  })

  const [recentReviews, setRecentReviews] = useState<ReviewHistory[]>([
    { id: '1', language: 'javascript', timestamp: new Date(Date.now() - 3600000), issues: 3, suggestions: 5 },
    { id: '2', language: 'python', timestamp: new Date(Date.now() - 7200000), issues: 1, suggestions: 2 },
    { id: '3', language: 'typescript', timestamp: new Date(Date.now() - 86400000), issues: 0, suggestions: 3 },
  ])

  // Real-time chart data state
  const [activityData, setActivityData] = useState([
    { name: 'Mon', reviews: 4, fullDate: 'Monday' },
    { name: 'Tue', reviews: 3, fullDate: 'Tuesday' },
    { name: 'Wed', reviews: 7, fullDate: 'Wednesday' },
    { name: 'Thu', reviews: 5, fullDate: 'Thursday' },
    { name: 'Fri', reviews: 8, fullDate: 'Friday' },
    { name: 'Sat', reviews: 2, fullDate: 'Saturday' },
    { name: 'Sun', reviews: 3, fullDate: 'Sunday' },
  ])

  const [languageData, setLanguageData] = useState([
    { name: 'JavaScript', value: 35, color: '#f7df1e', gradient: ['#f7df1e', '#ff9800'] },
    { name: 'Python', value: 25, color: '#3776ab', gradient: ['#3776ab', '#00bcd4'] },
    { name: 'TypeScript', value: 20, color: '#3178c6', gradient: ['#3178c6', '#00acc1'] },
    { name: 'Java', value: 12, color: '#b07219', gradient: ['#b07219', '#ff9800'] },
    { name: 'Others', value: 8, color: '#6b7280', gradient: ['#6b7280', '#9e9e9e'] },
  ])

  // Update activity data when new reviews are made (real-time effect)
  useEffect(() => {
    if (stats.totalReviews > 0) {
      const today = new Date().getDay()
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const todayName = dayNames[today]
      
      setActivityData(prev => prev.map(day => 
        day.name === todayName 
          ? { ...day, reviews: day.reviews + 1 }
          : day
      ))
    }
  }, [stats.totalReviews])

  // Update language data based on recent reviews
  useEffect(() => {
    if (recentReviews.length > 0) {
      const langCounts: { [key: string]: number } = {}
      recentReviews.forEach(review => {
        langCounts[review.language] = (langCounts[review.language] || 0) + 1
      })
      
      const total = recentReviews.length
      const updatedLangData = languageData.map(lang => {
        const count = langCounts[lang.name.toLowerCase()] || 0
        return {
          ...lang,
          value: total > 0 ? Math.round((count / total) * 100) : lang.value
        }
      })
      
      setLanguageData(updatedLangData)
    }
  }, [recentReviews])

  const handleLogout = () => {
    localStorage.removeItem('token')
    if (onLogout) {
      onLogout()
    }
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

      // Auto-detect language if set to "auto"
      const actualLanguage = language === "auto" ? detectLanguage(code) : language
      
      const response = await aiAPI.getReview({ code, language: actualLanguage }, token)
      
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
        language: actualLanguage,
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
    <div className="min-h-screen bg-background relative">
      {/* Wallpaper Background - Very Subtle */}
      {wallpaper && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Main wallpaper layer - extremely low opacity */}
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
              className="w-full justify-start gap-3 text-base font-medium"
              onClick={() => setActiveTab("review")}
            >
              <Zap className="h-5 w-5" />
              {sidebarOpen && <span>New Review</span>}
            </Button>

            <Button 
              variant={activeTab === "history" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 text-base font-medium"
              onClick={() => setActiveTab("history")}
            >
              <History className="h-5 w-5" />
              {sidebarOpen && <span>History</span>}
            </Button>

            <Button 
              variant={activeTab === "analytics" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 text-base font-medium"
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3 className="h-5 w-5" />
              {sidebarOpen && <span>Analytics</span>}
            </Button>

            <Button 
              variant={activeTab === "github" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 text-base font-medium"
              onClick={() => setActiveTab("github")}
            >
              <Github className="h-5 w-5" />
              {sidebarOpen && <span>GitHub</span>}
            </Button>

            <Button 
              variant={activeTab === "local" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 text-base font-medium"
              onClick={() => setActiveTab("local")}
            >
              <FolderOpen className="h-5 w-5" />
              {sidebarOpen && <span>Local Files</span>}
            </Button>

            <Button 
              variant={activeTab === "settings" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 text-base font-medium"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-5 w-5" />
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
                <Card className="bg-slate-900/90 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-slate-100">Total Reviews</CardTitle>
                    <FileCode className="h-5 w-5 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats.totalReviews}</div>
                    <p className="text-sm text-slate-400">
                      +{stats.todayReviews} today
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/90 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-slate-100">Solutions Applied</CardTitle>
                    <CheckCircle2 className="h-5 w-5 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats.totalSolutions}</div>
                    <p className="text-sm text-slate-400">
                      Issues resolved
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/90 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-slate-100">Avg Issues</CardTitle>
                    <AlertCircle className="h-5 w-5 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats.avgIssues || 2.4}</div>
                    <p className="text-sm text-slate-400">
                      Per review
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/90 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-slate-100">Review Time</CardTitle>
                    <Clock className="h-5 w-5 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">2.5s</div>
                    <p className="text-sm text-slate-400">
                      Avg response
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Code Review Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2 bg-slate-900/90 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                      <Code2 className="h-6 w-6" />
                      Your Code
                    </CardTitle>
                    <CardDescription className="text-base text-slate-400">
                      Paste your code here for AI-powered review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-base font-semibold text-slate-200">
                          Programming Language
                        </label>
                        {language === "auto" && code && (
                          <span className="text-sm text-green-400 font-semibold">
                            ✓ Auto: {LANGUAGES.find(l => l.value === detectLanguage(code))?.label.split(' ')[1] || 'Detected'}
                          </span>
                        )}
                      </div>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full p-3 text-base border rounded-md bg-slate-800 border-slate-600 text-slate-100 focus:ring-2 focus:ring-primary"
                      >
                        <optgroup label="Smart Detection">
                          <option value="auto">🔍 Auto Detect Language</option>
                        </optgroup>
                        <optgroup label="Popular Languages">
                          {LANGUAGES.filter(l => 
                            ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Web Development">
                          {LANGUAGES.filter(l => 
                            ['html', 'css', 'scss', 'react', 'vue', 'angular', 'svelte'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Mobile & Desktop">
                          {LANGUAGES.filter(l => 
                            ['swift', 'kotlin', 'dart', 'flutter', 'objectivec', 'csharp'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Data & AI">
                          {LANGUAGES.filter(l => 
                            ['r', 'matlab', 'julia', 'python', 'sql', 'sas'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Systems & Low Level">
                          {LANGUAGES.filter(l => 
                            ['c', 'cpp', 'rust', 'assembly', 'zig', 'v', 'nim'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Functional & Other">
                          {LANGUAGES.filter(l => 
                            ['haskell', 'clojure', 'erlang', 'elixir', 'ocaml', 'fsharp', 'scala', 'lua', 'perl', 'groovy'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Config & Markup">
                          {LANGUAGES.filter(l => 
                            ['json', 'yaml', 'xml', 'toml', 'markdown', 'latex', 'sql', 'graphql'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Shell & Scripts">
                          {LANGUAGES.filter(l => 
                            ['bash', 'powershell', 'perl', 'python'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Legacy & Enterprise">
                          {LANGUAGES.filter(l => 
                            ['fortran', 'cobol', 'abap', 'plsql', 'tsql', 'sas'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Hardware & Embedded">
                          {LANGUAGES.filter(l => 
                            ['arduino', 'vhdl', 'verilog', 'mbed', 'platformio'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Blockchain">
                          {LANGUAGES.filter(l => 
                            ['solidity', 'vyper'].includes(l.value)
                          ).map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    
                    <Textarea
                      placeholder="// Paste your code here...\nfunction example() {\n  // Your code here\n}"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="min-h-[350px] font-mono text-base bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
                    />
                    
                    {error && (
                      <div className="p-4 bg-red-950/80 border border-red-700 rounded-md">
                        <p className="text-base text-red-300 whitespace-pre-wrap">{error}</p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleReview} 
                      className="w-full text-base font-semibold"
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
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
                            <AIReviewDisplay review={review} />
                            
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
                    <Card className="border-2 bg-slate-900/90 border-slate-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <CheckCircle2 className="h-6 w-6" />
                          AI Review
                        </CardTitle>
                        <CardDescription className="text-base text-slate-400">
                          AI-powered code review and suggestions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center py-20">
                          <div className="bg-slate-800 rounded-full p-6 mb-6">
                            <Zap className="h-10 w-10 text-slate-400" />
                          </div>
                          <p className="text-2xl font-bold text-slate-100">Ready to Review</p>
                          <p className="text-base max-w-sm text-center mt-4 text-slate-400">
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
              <Card className="border-2 border-gradient-to-br from-purple-500/20 to-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Code reviews over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accentColor} stopOpacity={1} />
                            <stop offset="100%" stopColor={accentColor} stopOpacity={0.6} />
                          </linearGradient>
                          <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.9)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                          }}
                          itemStyle={{ color: '#fff' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar 
                          dataKey="reviews" 
                          fill="url(#barGradient)"
                          radius={[8, 8, 0, 0]}
                          animationDuration={1500}
                          animationBegin={0}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

                <Card className="border-2 border-gradient-to-br from-green-500/20 to-teal-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-primary" />
                      Languages
                    </CardTitle>
                    <CardDescription>Distribution by programming language</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {languageData.map((entry, index) => (
                              <linearGradient key={`grad-${index}`} id={`pieGrad-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={entry.gradient[0]} />
                                <stop offset="100%" stopColor={entry.gradient[1]} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={languageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={3}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={1500}
                            animationBegin={300}
                          >
                            {languageData.map((_entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#pieGrad-${index})`}
                                stroke="rgba(0,0,0,0.3)"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.9)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#fff' }}
                          />
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

          {activeTab === "local" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FolderOpen className="h-6 w-6" />
                  Local Files
                </h2>
              </div>
              
              <LocalFolderBrowser />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-4xl space-y-6">
              {!showSystemSettings ? (
                <>
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
                            Light or Dark mode
                          </p>
                        </div>
                        <select
                          value={theme}
                          onChange={(e) => {
                            const newTheme = e.target.value
                            if (newTheme === 'system') {
                              setShowSystemSettings(true)
                            } else {
                              setTheme(newTheme as 'light' | 'dark')
                            }
                          }}
                          className="p-2 border rounded-md bg-background"
                        >
                          <option value="light">☀️ Light</option>
                          <option value="dark">🌙 Dark</option>
                          <option value="system">💻 System (Advanced)</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Advanced Customization</label>
                            <p className="text-sm text-muted-foreground">
                              Colors, wallpapers, and effects
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowSystemSettings(true)}
                            className="gap-2"
                          >
                            <Monitor className="h-4 w-4" />
                            Customize
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {wallpaper && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-primary" />
                          Active Wallpaper
                        </CardTitle>
                        <CardDescription>
                          Your custom dashboard wallpaper is active
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-24 h-16 rounded-lg bg-cover bg-center border"
                              style={{ backgroundImage: `url(${wallpaper})` }}
                            />
                            <div>
                              <p className="text-sm font-medium">Custom Wallpaper</p>
                              <p className="text-xs text-muted-foreground">
                                Mode: {wallpaperMode} • Blur: {wallpaperBlur}px • Opacity: {Math.round(wallpaperOpacity * 100)}%
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowSystemSettings(true)}
                          >
                            <Monitor className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Monitor className="h-6 w-6" />
                      System Customization
                    </h2>
                    <Button variant="outline" onClick={() => setShowSystemSettings(false)}>
                      Back to Settings
                    </Button>
                  </div>
                  
                  <SystemSettings
                    accentColor={accentColor}
                    setAccentColor={setAccentColor}
                    wallpaper={wallpaper}
                    setWallpaper={setWallpaper}
                    wallpaperMode={wallpaperMode}
                    setWallpaperMode={setWallpaperMode}
                    wallpaperBlur={wallpaperBlur}
                    setWallpaperBlur={setWallpaperBlur}
                    wallpaperOpacity={wallpaperOpacity}
                    setWallpaperOpacity={setWallpaperOpacity}
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

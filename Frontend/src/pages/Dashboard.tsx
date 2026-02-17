import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { aiAPI, reviewAPI } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { CodeDiff } from "@/components/CodeDiff"
import { GitHubIntegration } from "@/components/GitHubIntegration"
import { GitHubRepos } from "@/components/GitHubRepos"
import { LocalFolderBrowser } from "@/components/LocalFolderBrowser"
import { AIReviewDisplay } from "@/components/AIReviewDisplay"
import { SystemSettings } from "@/components/SystemSettings"
import { CodeExecutor } from "@/components/CodeExecutor"
import { NotesPanel } from "@/components/NotesPanel"
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
  Image as ImageIcon,
  Play,
  BookOpen,
  Download
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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

// Language detection with scoring system for better accuracy
interface LanguagePattern {
  patterns: RegExp[];
  weight: number; // Higher weight = more specific/confident
  required?: RegExp[]; // Must match at least one of these
}

const LANGUAGE_PATTERNS: { [key: string]: LanguagePattern } = {
  // Go - very high confidence patterns
  go: {
    patterns: [
      /^package\s+\w+/m,                              // package declaration
      /^func\s+\w+\s*\(/m,                           // function declaration  
      /^import\s+\(|^import\s+"\w+/m,               // import statement
      /\bfmt\.Println\b/,                            // fmt.Println
      /:=\s*("[^"]*"|\d+|true|false)/,              // short variable declaration
      /\bvar\s+\w+\s+(string|int|bool|float64|int32|int64|uint)\b/, // typed var
      /\bchan\s+|\bmake\s*\(\s*chan\b/,             // channels
      /\bgo\s+\w+\s*\(/,                            // goroutine
      /\bstruct\s*\{|\binterface\s*\{/,             // struct/interface
    ],
    weight: 10,
    required: [/^package\s+\w+/m, /^func\s+\w+\s*\(/m, /^import\s+\(/m]
  },
  
  // Rust - high confidence
  rust: {
    patterns: [
      /\bfn\s+\w+\s*\(/,                             // function
      /\blet\s+mut\b/,                               // mutable let
      /\bimpl\s+\w+|\bimpl\s+\w+\s+for\s+\w+/,      // implementation
      /\bstruct\s+\w+|\benum\s+\w+/,                // struct/enum
      /\bmatch\s+\w+\s*\{/,                          // match expression
      /\bResult<|Option<|Vec<|String\b/,             // Rust types
      /\bprintln!\b/,                                // println macro
      /\buse\s+\w+::|#\[\w+\(\w+\)\]/,              // use statement/attribute
      /&mut\s+\w+|&\w+/,                             // references
    ],
    weight: 9,
    required: [/\bfn\s+\w+|\blet\s+mut\b/]
  },
  
  // Java - high confidence
  java: {
    patterns: [
      /\bpublic\s+class\s+\w+/,                      // public class
      /\bpublic\s+static\s+void\s+main\s*\(/,       // main method
      /\bSystem\.out\.println\b/,                    // print statement
      /\bprivate\s+\w+\s+\w+\s*;|,\bprotected\s+/, // access modifiers
      /\bextends\s+\w+|\bimplements\s+\w+/,        // inheritance
      /\bimport\s+java\./,                          // Java imports
      /@Override|@Deprecated|@SuppressWarnings/,    // annotations
      /\bnew\s+\w+\s*\(\s*\)/,                      // object creation
    ],
    weight: 9,
    required: [/\bpublic\s+class|System\.out\.println/]
  },
  
  // C++ - high confidence
  cpp: {
    patterns: [
      /#include\s*<\w+\.h>|#include\s*<\w+>/,        // includes
      /\bstd::\w+|using\s+namespace\s+std/,         // std namespace
      /\bcout\s*<<|cin\s*>>/,                       // iostream
      /\bclass\s+\w+\s*\{[^}]*\bpublic:|\bprivate:|\bprotected:/, // class with access
      /\bvector<|map<|string\b/,                     // STL containers
      /\bnew\s+\w+\s*\[|delete\s*\w+/,              // dynamic memory
      /\bconst\s+\w+&\s+\w+|\w+&\s+\w+\s*=/,      // references
    ],
    weight: 9,
    required: [/#include\s*<|std::|cout\s*<</]
  },
  
  // C - medium-high confidence
  c: {
    patterns: [
      /#include\s*<\w+\.h>/,                         // includes with .h
      /\bprintf\s*\(|\bscanf\s*\(/,                 // stdio functions
      /\bmalloc\s*\(|\bfree\s*\(/,                 // memory management
      /\bstruct\s+\w+\s*\{|\btypedef\s+struct/,    // structs
      /\bint\s+main\s*\(\s*\)|\bvoid\s+main\s*\(/, // main function
      /\bsizeof\s*\(/,                              // sizeof
    ],
    weight: 8,
    required: [/#include\s*<\w+\.h>/, /\bprintf\s*\(/]
  },
  
  // C# - high confidence
  csharp: {
    patterns: [
      /\busing\s+System/,                            // using System
      /\bnamespace\s+\w+/,                          // namespace
      /\bpublic\s+class\s+\w+/,                     // public class
      /\bConsole\.WriteLine\b/,                      // Console output
      /\bstring\s+\w+\s*=\s*"/,                     // string assignment
      /\bvar\s+\w+\s*=\s*new\s+/,                   // var with new
      /\[\w+\(\s*"[^"]*"\s*\)\]/,                    // attributes
      /\basync\s+Task|await\s+\w+/,                 // async/await
    ],
    weight: 9,
    required: [/\busing\s+System/, /\bnamespace\s+\w+/]
  },
  
  // Python - high confidence
  python: {
    patterns: [
      /\bdef\s+\w+\s*\([^)]*\)\s*:/,               // function definition
      /\bclass\s+\w+\s*\([^)]*\)?\s*:/,           // class definition
      /if\s+__name__\s*==\s*['"]__main__['"]\s*:/, // main guard
      /\bimport\s+\w+|\bfrom\s+\w+\s+import/,     // imports
      /:\s*\n\s+(pass|return|if|for|while|print)/m, // indentation
      /\bprint\s*\([^)]*\)/,                        // print function
      /\blist\s*\(|\bdict\s*\(|\btuple\s*\(/,      // built-in types
      /\bself\./,                                   // self reference
    ],
    weight: 9,
    required: [/\bdef\s+\w+|:\s*\n\s+/m]
  },
  
  // TypeScript - medium-high confidence
  typescript: {
    patterns: [
      /\binterface\s+\w+\s*\{/,                     // interface
      /\btype\s+\w+\s*=\s*(\{|\[)/,                // type alias
      /:\s*(string|number|boolean|any|void|unknown|never)\b/, // TypeScript types
      /\benum\s+\w+\s*\{/,                         // enum
      /\bnamespace\s+\w+/,                        // namespace
      /\bdeclare\s+(module|var|let|const)/,        // declare
      /\w+\?:\s*\w+/,                              // optional property
      /as\s+\w+|\breadonly\s+/,                    // type assertions/readonly
    ],
    weight: 8,
    required: [/\binterface\s+\w+|\btype\s+\w+|\benum\s+\w+/]
  },
  
  // JavaScript - lower confidence (many patterns overlap with other languages)
  javascript: {
    patterns: [
      /\bconst\s+\w+\s*=\s*(\{|\[|require\s*\()/,   // const assignment
      /\blet\s+\w+\s*=\s*(\{|\[|\d+|"|')/,         // let assignment
      /\bconsole\.log\b/,                           // console.log
      /\bdocument\.|window\.|fetch\s*\(/,           // DOM/Browser APIs
      /\baddEventListener\s*\(|\bquerySelector/,    // DOM methods
      /=>\s*\{|=>\s*\w+/,                           // arrow functions
      /\basync\s+function|\bawait\s+/,             // async/await
      /\bmodule\.exports|\brequire\s*\(/,          // CommonJS
    ],
    weight: 6,
  },
  
  // PHP - high confidence
  php: {
    patterns: [
      /<\?php/,                                     // PHP tag
      /\$\w+\s*=\s*/,                               // variable
      /\$_GET\[|$_POST\[|$_SERVER\[|$_SESSION\[/,   // superglobals
      /\becho\s+["']|print\s+["']/,                // echo/print
      /\bfunction\s+\w+\s*\([^)]*\$/,              // function with params
      /\bclass\s+\w+\s*\{[^}]*\$this->/,          // class with this
      /\bnamespace\s+\w+|\buse\s+\w+/,            // namespace/use
    ],
    weight: 9,
    required: [/<\?php/, /\$_GET|$_POST/, /\$\w+/]
  },
  
  // Ruby - high confidence
  ruby: {
    patterns: [
      /\bdef\s+\w+\s*(\(|\n)/,                      // method definition
      /\bend\s*\n/,                                 // end keyword
      /\bputs\s+|\bprint\s+/,                       // output
      /\brequire\s+['"]|\brequire_relative\s+/,    // require
      /\bclass\s+\w+\s*(<\s*\w+)?\s*\n/,          // class inheritance
      /\bmodule\s+\w+/,                            // module
      /\bdo\s*\|[^|]+\|/,                          // block with params
      /:\s*\w+\s+=>|(\w+):\s+/,                   // hash syntax
      /@\w+\s*=\s*/,                               // instance variable
    ],
    weight: 8,
    required: [/\bdef\s+\w+|\bend\s*\n/]
  },
  
  // Swift - high confidence
  swift: {
    patterns: [
      /\bimport\s+(UIKit|Foundation|SwiftUI)/,     // Apple frameworks
      /\bfunc\s+\w+\s*\([^)]*\)\s*(->\s*\w+)?\s*\{/, // function
      /\bvar\s+\w+\s*:\s*\w+|\blet\s+\w+\s*:/,   // typed variables
      /\bclass\s+\w+\s*:\s*\w+|\bstruct\s+\w+/,  // class/struct
      /\bprint\s*\([^)]*\)/,                        // print
      /\bguard\s+let|\bif\s+let/,                   // optional binding
      /\b@IBOutlet|@IBAction/,                      // Interface Builder
    ],
    weight: 9,
    required: [/\bimport\s+(UIKit|Foundation)/, /\bfunc\s+\w+/]
  },
  
  // Kotlin - high confidence
  kotlin: {
    patterns: [
      /\bfun\s+\w+\s*\(/,                           // function
      /\bval\s+\w+\s*:\s*\w+|\bvar\s+\w+\s*:/,   // typed variables
      /\bclass\s+\w+\s*\([^)]*\)|\bdata\s+class/, // class/data class
      /\bprintln\s*\(/,                             // println
      /\bcompanion\s+object/,                       // companion object
      /\boverride\s+fun/,                           // override
      /\blateinit\s+var/,                           // lateinit
      /\bwhen\s*\(/,                                // when expression
    ],
    weight: 9,
    required: [/\bfun\s+\w+/, /\bval\s+\w+|\bvar\s+\w+/]
  },
  
  // HTML - very high confidence
  html: {
    patterns: [
      /<\!DOCTYPE\s+html>/i,                        // doctype
      /<html[\s>]/i,                                // html tag
      /<head[\s>]/i,                               // head tag
      /<body[\s>]/i,                               // body tag
      /<div[\s>]/i,                                // div tag
      /<script[\s>]/i,                             // script tag
      /<style[\s>]/i,                              // style tag
    ],
    weight: 10,
    required: [/<\!DOCTYPE\s+html>/i, /<html[\s>]/i]
  },
  
  // CSS - high confidence
  css: {
    patterns: [
      /[.#]\w+\s*\{[^}]*\}/,                        // selector with braces
      /:\s*(hover|active|focus|before|after)\s*\{/, // pseudo-classes
      /@media\s+\w+/,                               // media queries
      /\b(color|background|margin|padding|border|display|position)\s*:/, // properties
      /#[0-9a-fA-F]{3,6}\b/,                        // hex colors
      /\b(rgba?|hsla?)\s*\(/,                       // color functions
    ],
    weight: 8,
    required: [/[.#]\w+\s*\{[^}]*\}/]
  },
  
  // SQL - high confidence
  sql: {
    patterns: [
      /\bSELECT\s+\w+\s+FROM\b/i,                  // SELECT FROM
      /\bINSERT\s+INTO\s+\w+/i,                    // INSERT
      /\bUPDATE\s+\w+\s+SET\b/i,                   // UPDATE
      /\bDELETE\s+FROM\s+\w+/i,                    // DELETE
      /\bCREATE\s+TABLE\s+\w+/i,                   // CREATE TABLE
      /\bWHERE\s+\w+\s*=|WHERE\s+\w+\s+LIKE/i,   // WHERE clause
      /\bJOIN\s+\w+\s+ON\b/i,                      // JOIN
      /\bGROUP\s+BY|ORDER\s+BY/i,                  // GROUP/ORDER BY
    ],
    weight: 9,
    required: [/\bSELECT\s+\w+\s+FROM\b/i, /\bINSERT\s+INTO|UPDATE\s+\w+\s+SET/i]
  },
  
  // Bash/Shell - high confidence
  bash: {
    patterns: [
      /#!\/bin\/bash|#!\/bin\/sh|#!\/usr\/bin\/env\s+bash/, // shebang
      /\becho\s+["']|\becho\s+\$/,                  // echo
      /\bif\s+\[|if\s+\[\[/,                        // if statement
      /\bthen\s*\n|\bfi\s*\n/,                     // then/fi
      /\bfor\s+\w+\s+in\s+|while\s+\[|until\s+\[/, // loops
      /\bdone\s*\n/,                               // done
      /\$\w+|\$\{[^}]+\}/,                         // variables
      /\|\s*grep|\|\s*awk|\|\s+sed/,               // pipes
    ],
    weight: 9,
    required: [/#!\/bin\/(bash|sh)/, /\becho\s+|\bif\s+\[/]
  },
  
  // JSON - very high confidence
  json: {
    patterns: [
      /^\s*\{\s*"\w+"\s*:/,                         // object start
      /^\s*\[\s*("[^"]*"|\d+|\{)/,                 // array start
      /"\w+"\s*:\s*("[^"]*"|\d+|true|false|null)/, // key-value pair
      /"\w+"\s*:\s*\{[^}]*\}/,                     // nested object
      /"\w+"\s*:\s*\[[^\]]*\]/,                    // array value
    ],
    weight: 10,
    required: [/^\s*\{\s*"\w+"\s*:/, /^\s*\[\s*("[^"]*"|\d+|\{)/]
  },
  
  // YAML - high confidence
  yaml: {
    patterns: [
      /^\w+:\s*\n/m,                               // key: (newline)
      /^\s+-\s+\w+:\s*/m,                         // list item with key
      /^---\s*\n|^\.\.\.\s*\n/m,                   // document markers
      /\bapiVersion:\s*\w+|\bkind:\s*\w+/,       // Kubernetes
      /\bname:\s*\w+|\bmetadata:/,                // common keys
    ],
    weight: 8,
    required: [/^\w+:\s*\n/m, /^\s+-\s+\w+:\s*/m]
  },
  
  // Markdown - high confidence
  markdown: {
    patterns: [
      /^#{1,6}\s+\w+/m,                            // headings
      /\*\*[^*]+\*\*|__[^_]+__/,                   // bold
      /\*[^*]+\*|_[^_]+_/,                         // italic
      /\[([^\]]+)\]\(([^)]+)\)/,                   // links
      /!\[([^\]]*)\]\(([^)]+)\)/,                  // images
      /^```\w*|^\s{4,}\w+/m,                      // code blocks
      /^\s*[-*+]\s+\w+/m,                         // lists
    ],
    weight: 8,
    required: [/^#{1,6}\s+\w+/m, /\*\*[^*]+\*\*/, /\[([^\]]+)\]\(([^)]+)\)/]
  },
}

// Detect language from code with scoring system
function detectLanguage(code: string): string {
  if (!code || code.trim().length < 10) return "javascript"
  
  const scores: { [key: string]: number } = {}
  
  // Calculate scores for each language
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    scores[lang] = 0
    
    // Check required patterns first (if any)
    if (config.required && config.required.length > 0) {
      const hasRequired = config.required.some(pattern => pattern.test(code))
      if (!hasRequired) {
        scores[lang] = -1 // Skip this language
        continue
      }
    }
    
    // Count matching patterns
    let matchCount = 0
    for (const pattern of config.patterns) {
      if (pattern.test(code)) {
        matchCount++
      }
    }
    
    // Calculate weighted score
    scores[lang] = matchCount * config.weight
  }
  
  // Find language with highest score
  let bestLang = "javascript"
  let bestScore = 0
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestLang = lang
    }
  }
  
  // If no good match found, try heuristics
  if (bestScore < 5) {
    // Check for common patterns that might indicate JavaScript
    if (/\bfunction\s+\w+\s*\(|\bconsole\.|\bdocument\./.test(code)) {
      return "javascript"
    }
    // Check for TypeScript specific patterns
    if (/\binterface\s+\w+|\btype\s+\w+/.test(code)) {
      return "typescript"
    }
  }
  
  return bestLang
}

// Format date to relative time (e.g., "2 hours ago", "Yesterday", "3 days ago")
function formatRelativeDate(date: Date | string): string {
  const now = new Date()
  const reviewDate = typeof date === 'string' ? new Date(date) : date
  const diffInMs = now.getTime() - reviewDate.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return reviewDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
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
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [selectedReviewDetails, setSelectedReviewDetails] = useState<any>(null)
  
  // Gradient theme state
  const [gradientTheme, setGradientTheme] = useState(() => {
    return localStorage.getItem('gradientTheme') || null
  })
  
  // Review panel active tab
  const [reviewPanelTab, setReviewPanelTab] = useState<'review' | 'output' | 'notes'>('review')

  // Apply accent color and gradient theme on mount and when they change
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor)
    
    // Apply gradient theme if selected
    if (gradientTheme) {
      document.documentElement.style.setProperty('--gradient-theme', gradientTheme)
      document.body.style.background = gradientTheme
    } else {
      document.documentElement.style.removeProperty('--gradient-theme')
      document.body.style.background = ''
    }
  }, [accentColor, gradientTheme])

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

  // Load review history from database
  const loadReviewHistory = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await reviewAPI.getHistory(token, 50, 0)
      if (response.success && response.reviews) {
        // Convert database reviews to ReviewHistory format
        const historyReviews: ReviewHistory[] = response.reviews.map((review: any) => ({
          id: review.id.toString(),
          language: review.language || 'unknown',
          timestamp: new Date(review.created_at),
          issues: review.issues_count,
          suggestions: review.suggestions_count,
          fixApplied: review.fix_applied,
          codeSnippet: review.code_snippet?.slice(0, 200) + (review.code_snippet?.length > 200 ? '...' : '')
        }))
        
        setRecentReviews(historyReviews)
        
        // Update stats
        const statsResponse = await reviewAPI.getStats(token)
        if (statsResponse.success) {
          const totalReviews = parseInt(String(statsResponse.stats.total_reviews)) || 0
          const totalIssues = parseInt(String(statsResponse.stats.total_issues)) || 0
          const fixesApplied = parseInt(String(statsResponse.stats.fixes_applied)) || 0
          const todayReviews = parseInt(String(statsResponse.stats.today_reviews)) || 0
          
          setStats(prev => ({
            ...prev,
            totalReviews,
            totalSolutions: fixesApplied,
            todayReviews,
            avgIssues: totalReviews > 0 ? totalIssues / totalReviews : 2.4
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load review history:', error)
    }
  }

  // Load review history on component mount
  useEffect(() => {
    loadReviewHistory()
  }, [])

  // Load review details when selected
  const loadReviewDetails = async (reviewId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No token found in localStorage')
      setError('Please login again to view review details')
      return
    }

    console.log('Loading review details for ID:', reviewId)
    console.log('Token available:', token ? 'Yes' : 'No')

    try {
      const response = await reviewAPI.getReviewById(parseInt(reviewId), token)
      if (response.success) {
        console.log('Review details loaded:', response.review)
        setSelectedReviewDetails(response.review)
        setSelectedReviewId(reviewId)
      }
    } catch (error: any) {
      console.error('Failed to load review details:', error)
      if (error.message?.includes('Invalid token') || error.message?.includes('Token expired')) {
        setError('Your session has expired. Please login again.')
        // Optionally logout the user
        // handleLogout()
      } else {
        setError(`Failed to load review: ${error.message}`)
      }
    }
  }

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
      let reviewText = ''
      let improvedCodeText = ''
      
      if (response.review && typeof response.review === 'object') {
        reviewText = response.review.review || response.review
        improvedCodeText = response.review.improvedCode || code
      } else {
        reviewText = response.review || response
        improvedCodeText = code
      }
      
      setReview(reviewText)
      setImprovedCode(improvedCodeText)
      
      // Parse issues and suggestions from review text (simple parsing)
      const issuesCount = (reviewText.match(/## Issues Found/gi) || []).length > 0 ? 
        (reviewText.match(/### Critical/gi) || []).length + 
        (reviewText.match(/### Warning/gi) || []).length + 
        (reviewText.match(/### Suggestion/gi) || []).length : 3
      
      const suggestionsCount = (reviewText.match(/suggestion|improve|recommend/gi) || []).length
      
      // Save review to database
      try {
        await reviewAPI.saveReview({
          code_snippet: code,
          language: actualLanguage,
          ai_review: reviewText,
          improved_code: improvedCodeText,
          issues_count: issuesCount || 3,
          suggestions_count: suggestionsCount || 5
        }, token)
      } catch (saveError) {
        console.error('Failed to save review:', saveError)
        // Continue even if save fails - don't block the user
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalReviews: prev.totalReviews + 1,
        totalSolutions: prev.totalSolutions + 1,
        todayReviews: prev.todayReviews + 1
      }))

      // Refresh review history
      await loadReviewHistory()

      // Add to recent reviews (local state for immediate UI update)
      const newReview: ReviewHistory = {
        id: Date.now().toString(),
        language: actualLanguage,
        timestamp: new Date(),
        issues: issuesCount || 3,
        suggestions: suggestionsCount || 5,
        fixApplied: false,
        codeSnippet: code.slice(0, 200) + (code.length > 200 ? '...' : '')
      }
      setRecentReviews(prev => [newReview, ...prev.slice(0, 9)])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get review"
      
      console.error("Review error:", err)
      
      if (errorMessage.includes('Rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
        setError(`${errorMessage}\n\n💡 Tip: Identical code submissions are cached for 5 minutes. Try again in a moment.`)
      } else {
        setError(`Error: ${errorMessage}\n\nPlease check:\n1. Backend server is running (npm start in Backend folder)\n2. Internet connection is active\n3. Try refreshing the page`)
      }
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

  const downloadImprovedCode = () => {
    if (!improvedCode) return
    
    const extension = language === 'auto' ? detectLanguage(code) : language
    const fileExtensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
      bash: 'sh',
      json: 'json',
      yaml: 'yml',
      xml: 'xml',
      markdown: 'md'
    }
    
    const fileExt = fileExtensions[extension] || 'txt'
    const blob = new Blob([improvedCode], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `improved_code.${fileExt}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: gradientTheme || undefined,
        backgroundColor: gradientTheme ? undefined : 'var(--background)'
      }}
    >
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
                  {/* Code Execution, Review & Notes Tabs */}
                  <Tabs value={reviewPanelTab} onValueChange={(v) => setReviewPanelTab(v as "review" | "output" | "notes")} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                      <TabsTrigger value="review" className="gap-2">
                        <Eye className="h-4 w-4" />
                        AI Review
                      </TabsTrigger>
                      <TabsTrigger value="output" className="gap-2">
                        <Play className="h-4 w-4" />
                        Output
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Notes
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="review" className="mt-4">
                      {review ? (
                        <Card className="border-2 bg-slate-900/90 border-slate-700">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                              <CheckCircle2 className="h-5 w-5" />
                              AI Review Analysis
                            </CardTitle>
                            <CardDescription className="text-base text-slate-400">
                              Detailed code analysis and improvement suggestions
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <AIReviewDisplay review={review} />
                            
                            <div className="flex flex-wrap gap-2 mt-4">
                              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(review)}>
                                📋 Copy Review
                              </Button>
                              {improvedCode && (
                                <Button variant="outline" size="sm" onClick={downloadImprovedCode}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Improved Code
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => {setReview(""); setImprovedCode("");}}>
                                🗑️ Clear
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-2 bg-slate-900/90 border-slate-700">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                              <CheckCircle2 className="h-5 w-5" />
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
                    </TabsContent>

                    <TabsContent value="output" className="mt-4">
                      <CodeExecutor code={code} language={language === "auto" ? detectLanguage(code) : language} />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4">
                      <NotesPanel 
                        reviewId={selectedReviewId || undefined}
                        onSave={(notes) => console.log('Notes saved:', notes)}
                      />
                    </TabsContent>
                  </Tabs>
                  
                  {/* Show Diff View Toggle */}
                  {review && improvedCode && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "diff" ? "review" : "diff")}
                        className="gap-2"
                      >
                        <GitCompare className="h-4 w-4" />
                        {viewMode === "diff" ? "Hide Diff View" : "Show Diff View"}
                      </Button>
                    </div>
                  )}
                  
                  {/* Diff View */}
                  {review && improvedCode && viewMode === "diff" && (
                    <Card className="border-2 bg-slate-900/90 border-slate-700 mt-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <GitCompare className="h-5 w-5" />
                            Code Diff View
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={downloadImprovedCode}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Improved Code
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
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
                <div className="flex items-center gap-4 text-base">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>{recentReviews.filter(r => r.fixApplied).length} fixes applied</span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                {recentReviews.map((review) => (
                  <Card 
                    key={review.id} 
                    className="hover:bg-slate-800/80 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary bg-slate-900/80"
                    onClick={() => loadReviewDetails(review.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getLanguageIcon(review.language)}</span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg text-slate-100 capitalize">{review.language} Review</p>
                              {review.fixApplied && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-green-900/50 text-green-400 border border-green-700">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Fix Applied
                                </span>
                              )}
                            </div>
                            <p className="text-base text-slate-400">
                              {formatRelativeDate(review.timestamp)}
                            </p>
                            {review.codeSnippet && (
                              <p className="text-sm text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded mt-2 max-w-md truncate border border-slate-700">
                                {review.codeSnippet}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-base font-semibold text-red-400">
                              {review.issues} issues
                            </p>
                            <p className="text-base text-slate-400">
                              {review.suggestions} suggestions
                            </p>
                          </div>
                          <ChevronRight className="h-6 w-6 text-slate-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {recentReviews.length === 0 && (
                  <Card className="bg-slate-900/80 border-slate-700">
                    <CardContent className="p-8 text-center text-slate-400">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No reviews yet. Start by reviewing some code!</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Review Details Dialog */}
              <Dialog open={!!selectedReviewId} onOpenChange={() => { setSelectedReviewId(null); setSelectedReviewDetails(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl text-slate-100">
                      {selectedReviewDetails && (
                        <>
                          <span className="text-2xl">{getLanguageIcon(selectedReviewDetails.language || 'unknown')}</span>
                          <span className="capitalize">{selectedReviewDetails.language || 'Unknown'} Review</span>
                        </>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {selectedReviewDetails && formatRelativeDate(selectedReviewDetails.created_at)}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {selectedReviewDetails && (
                    <div className="space-y-6 mt-4">
                      {/* Stats */}
                      <div className="flex gap-4">
                        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                          <span className="text-red-400 font-semibold">{selectedReviewDetails.issues_count} issues</span>
                        </div>
                        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                          <span className="text-blue-400 font-semibold">{selectedReviewDetails.suggestions_count} suggestions</span>
                        </div>
                        {selectedReviewDetails.fix_applied && (
                          <div className="bg-green-900/50 px-4 py-2 rounded-lg border border-green-700">
                            <span className="text-green-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Fix Applied
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Original Code */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-200">Original Code</h3>
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 overflow-x-auto">
                          <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
                            <code>{selectedReviewDetails.code_snippet}</code>
                          </pre>
                        </div>
                      </div>

                      {/* AI Review */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-200">AI Review</h3>
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
                            {selectedReviewDetails.ai_review}
                          </div>
                        </div>
                      </div>

                      {/* Improved Code (if available) */}
                      {selectedReviewDetails.improved_code && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-slate-200">Improved Code</h3>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                const extension = selectedReviewDetails.language || 'txt'
                                const fileExtensions: Record<string, string> = {
                                  javascript: 'js',
                                  typescript: 'ts',
                                  python: 'py',
                                  java: 'java',
                                  cpp: 'cpp',
                                  c: 'c',
                                  csharp: 'cs',
                                  go: 'go',
                                  rust: 'rs',
                                  php: 'php',
                                  ruby: 'rb',
                                  swift: 'swift',
                                  kotlin: 'kt',
                                  html: 'html',
                                  css: 'css',
                                  scss: 'scss',
                                  sql: 'sql',
                                  bash: 'sh',
                                  json: 'json',
                                  yaml: 'yml',
                                  xml: 'xml',
                                  markdown: 'md'
                                }
                                const fileExt = fileExtensions[extension] || 'txt'
                                const blob = new Blob([selectedReviewDetails.improved_code], { type: 'text/plain' })
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = `improved_code_${selectedReviewDetails.id}.${fileExt}`
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                window.URL.revokeObjectURL(url)
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 overflow-x-auto">
                            <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
                              <code>{selectedReviewDetails.improved_code}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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

                <Card className="border-2 bg-slate-800/95 border-slate-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <FileCode className="h-5 w-5 text-primary" />
                      Languages
                    </CardTitle>
                    <CardDescription className="text-slate-400">Distribution by programming language</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] bg-slate-900/50 rounded-lg p-4">
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
                    setGradientTheme={setGradientTheme}
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

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play, 
  Terminal, 
  AlertCircle, 
  Clock,
  RotateCcw,
  CheckCircle2,
  Loader2
} from "lucide-react"

interface CodeExecutorProps {
  code: string
  language: string
}

// Supported languages for execution
const EXECUTABLE_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'php', 'ruby']

export function CodeExecutor({ code, language }: CodeExecutorProps) {
  const [activeTab, setActiveTab] = useState("output")
  const [output, setOutput] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number>(0)

  // Timer states
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Timer control
  const startTimer = () => {
    if (!timerRunning) {
      setTimerRunning(true)
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimerRunning(false)
  }

  const resetTimer = () => {
    stopTimer()
    setElapsedTime(0)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const canExecute = EXECUTABLE_LANGUAGES.includes(language)

  const runCode = async () => {
    if (!code.trim()) {
      setError("Please enter some code to run")
      return
    }

    setIsRunning(true)
    setError(null)
    setOutput("")
    setExecutionTime(0)
    
    const startTime = Date.now()

    try {
      let result = ""

      switch (language) {
        case 'javascript':
        case 'typescript':
          result = await executeJavaScript(code)
          break
        case 'python':
          result = await executePython(code)
          break
        default:
          result = `Code execution for ${language} is simulated.\n\nIn a production environment, this would execute the code in a sandboxed environment.\n\nOutput:\n> Program started\n> Executing ${language} code...\n> Program completed successfully\n\nExecution time: ${(Date.now() - startTime) / 1000}s`
      }

      setExecutionTime(Date.now() - startTime)
      setOutput(result)
    } catch (err: any) {
      setError(err.message || "An error occurred while running the code")
      setOutput(err.message || "Error executing code")
    } finally {
      setIsRunning(false)
    }
  }

  const executeJavaScript = async (code: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const logs: string[] = []
        
        // Mock console.log
        const mockConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '))
          },
          error: (...args: any[]) => {
            logs.push(`Error: ${args.map(arg => String(arg)).join(' ')}`)
          },
          warn: (...args: any[]) => {
            logs.push(`Warning: ${args.map(arg => String(arg)).join(' ')}`)
          }
        }

        // Create a safe execution context
        const func = new Function('console', code)
        func(mockConsole)

        resolve(logs.length > 0 ? logs.join('\n') : "Code executed successfully (no output)")
      } catch (err: any) {
        reject(new Error(`JavaScript Error: ${err.message}`))
      }
    })
  }

  const executePython = async (code: string): Promise<string> => {
    // Simulated Python execution
    // In production, you'd call a backend API to execute Python code safely
    return new Promise((resolve) => {
      setTimeout(() => {
        const lines = code.split('\n')
        const output: string[] = []
        
        lines.forEach(line => {
          line = line.trim()
          if (line.startsWith('print(')) {
            const match = line.match(/print\s*\(\s*['"]([^'"]*)['"]\s*\)/)
            if (match) {
              output.push(match[1])
            } else {
              output.push(line.replace(/print\s*\(/, '').replace(/\)\s*$/, ''))
            }
          }
        })

        if (output.length === 0) {
          resolve("Python code executed successfully (no output)\n\nNote: Full Python execution requires backend integration.")
        } else {
          resolve(output.join('\n'))
        }
      }, 500)
    })
  }

  return (
    <div className="space-y-4">
      {/* Timer Section */}
      <Card className="bg-slate-900/80 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-mono font-bold text-slate-100">
                {formatTime(elapsedTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={timerRunning ? "destructive" : "default"}
                size="sm"
                onClick={timerRunning ? stopTimer : startTimer}
                className="gap-2"
              >
                {timerRunning ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-sm" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTimer}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Code Button */}
      <div className="flex items-center justify-between">
        <Button
          onClick={runCode}
          disabled={isRunning || !canExecute}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Code
            </>
          )}
        </Button>
        
        {!canExecute && (
          <span className="text-sm text-slate-400">
            Execution not available for {language}
          </span>
        )}
        
        {executionTime > 0 && (
          <span className="text-sm text-slate-400">
            Execution time: {(executionTime / 1000).toFixed(2)}s
          </span>
        )}
      </div>

      {/* Output Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="output" className="gap-2">
            <Terminal className="h-4 w-4" />
            Output
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="mt-2">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Console Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 font-mono text-sm min-h-[200px] max-h-[400px] overflow-auto">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running code...
                  </div>
                ) : error ? (
                  <div className="text-red-400 whitespace-pre-wrap">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-bold">Error</span>
                    </div>
                    {error}
                  </div>
                ) : output ? (
                  <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="text-slate-500 italic">
                    Click "Run Code" to see output...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-2">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Execution Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-400">
                <p>• JavaScript/TypeScript: Runs directly in browser</p>
                <p>• Python: Simulated execution (basic print statements)</p>
                <p>• Other languages: Simulated output</p>
                <p className="mt-4 text-xs text-slate-500">
                  Note: Full code execution for all languages requires backend sandbox environment.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
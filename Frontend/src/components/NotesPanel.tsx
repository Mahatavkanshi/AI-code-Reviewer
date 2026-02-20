import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Pencil, 
  Highlighter, 
  Palette,
  Bold,
  Italic,
  Underline,
  Trash2,
  Save,
  Download
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface NotesPanelProps {
  reviewId?: string
  initialNotes?: string
  onSave?: (notes: string) => void
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a", text: "#854d0e" },
  { name: "Green", value: "#86efac", text: "#14532d" },
  { name: "Blue", value: "#93c5fd", text: "#1e3a8a" },
  { name: "Pink", value: "#f9a8d4", text: "#831843" },
  { name: "Orange", value: "#fdba74", text: "#7c2d12" },
  { name: "Purple", value: "#d8b4fe", text: "#581c87" },
  { name: "Red", value: "#fca5a5", text: "#7f1d1d" },
  { name: "Cyan", value: "#67e8f9", text: "#164e63" },
]

export function NotesPanel({ reviewId, initialNotes = "", onSave }: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0])
  const [savedNotes, setSavedNotes] = useState<string[]>([])
  const editorRef = useRef<HTMLDivElement>(null)

  // Load saved notes from localStorage
  useEffect(() => {
    if (reviewId) {
      const saved = localStorage.getItem(`notes_${reviewId}`)
      if (saved) {
        setNotes(saved)
      }
    }
  }, [reviewId])

  const handleSave = () => {
    if (reviewId) {
      localStorage.setItem(`notes_${reviewId}`, notes)
    }
    if (onSave) {
      onSave(notes)
    }
    
    // Add to saved notes list
    if (notes.trim() && !savedNotes.includes(notes)) {
      setSavedNotes(prev => [notes, ...prev].slice(0, 10))
    }
  }

  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes_${reviewId || 'review'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearNotes = () => {
    setNotes("")
    if (reviewId) {
      localStorage.removeItem(`notes_${reviewId}`)
    }
  }

  const applyHighlight = () => {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      const range = selection.getRangeAt(0)
      const span = document.createElement('span')
      span.style.backgroundColor = selectedColor.value
      span.style.color = selectedColor.text
      span.style.padding = '2px 4px'
      span.style.borderRadius = '3px'
      span.textContent = selection.toString()
      range.deleteContents()
      range.insertNode(span)
      
      // Update notes state
      if (editorRef.current) {
        setNotes(editorRef.current.innerHTML)
      }
    }
  }

  const toggleFormat = (format: 'bold' | 'italic' | 'underline') => {
    document.execCommand(format, false)
    if (editorRef.current) {
      setNotes(editorRef.current.innerHTML)
    }
  }

  return (
    <Card className="bg-slate-900/80 border-slate-700 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Review Notes
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="h-8 w-8 text-slate-400 hover:text-white"
              title="Save notes"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8 text-slate-400 hover:text-white"
              title="Download notes"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearNotes}
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              title="Clear notes"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap p-2 bg-slate-800 rounded-lg border border-slate-700">
          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFormat('bold')}
            className="h-8 w-8"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFormat('italic')}
            className="h-8 w-8"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFormat('underline')}
            className="h-8 w-8"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-slate-600 mx-1" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Highlighter 
                  className="h-4 w-4" 
                  style={{ color: selectedColor.value }}
                />
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 bg-slate-800 border-slate-700">
              <div className="grid grid-cols-4 gap-2">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColor(color)
                      applyHighlight()
                    }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      selectedColor.name === color.name 
                        ? 'border-white ring-2 ring-primary' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={applyHighlight}
            className="gap-2"
          >
            <Highlighter className="h-4 w-4" />
            Highlight
          </Button>
        </div>

        {/* Notes Editor */}
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[300px] p-6 bg-slate-800 rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary overflow-auto text-left"
          style={{
            fontFamily: 'system-ui, sans-serif',
            lineHeight: '1.8',
            fontSize: '1.1rem'
          }}
          onInput={(e) => setNotes(e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: notes || '<div style="padding: 4px 0;"><span class="text-slate-500 italic">Take your notes here... Select text and use the color picker to highlight important points.</span></div>' }}
        />

        {/* Quick Tips */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Select text and click highlight to color important points</li>
            <li>Use Bold, Italic, or Underline for formatting</li>
            <li>Notes are automatically saved</li>
            <li>Download notes as text file anytime</li>
          </ul>
        </div>

        {/* Saved Notes History */}
        {savedNotes.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-300 mb-2">Recent Notes:</p>
            <div className="space-y-2 max-h-32 overflow-auto">
              {savedNotes.map((note, index) => (
                <button
                  key={index}
                  onClick={() => setNotes(note)}
                  className="w-full text-left p-2 text-sm bg-slate-800 rounded border border-slate-700 hover:border-primary transition-colors truncate"
                >
                  {note.replace(/<[^\u003e]*>/g, '').substring(0, 50)}...
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
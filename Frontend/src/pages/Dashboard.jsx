import { useState, useEffect } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import Prism from "prismjs"
import Markdown from "react-markdown"
import axios from 'axios'
import "prismjs/components/prism-javascript"
import '../App.css'
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export default function Dashboard() {
  const [code, setCode] = useState(`function sum() {
  return 1 + 1;
}`)
  const [review, setReview] = useState(``)

  useEffect(() => {
    Prism.highlightAll()
  }, [])

  async function reviewCode() {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai/get-review`, { code })
      setReview(response.data)
    } catch (error) {
      console.error('Error fetching review:', error)
      setReview('❌ Failed to fetch review. Is the server running at http://localhost:3000?')
    }
  }

  return (
    <main style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: '"Fira code", "Fira Mono", monospace',
    }}>
      {/* Left: Code Editor */}
      <div className="left" style={{
        width: '50%',
        backgroundColor: '#000',
        color: '#fff',
        padding: '1rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          <Editor
            value={code}
            onValueChange={(code) => setCode(code)}
            highlight={(code) =>
              Prism.highlight(code, Prism.languages.javascript, "javascript")
            }
            padding={10}
            style={{
              fontSize: 16,
              minHeight: '100%',
              outline: 'none',
            }}
          />
        </div>
        <button
           onClick={reviewCode}
           style={{
             padding: '4px 12px',
             fontSize: '0.75rem',
             backgroundColor: '#cfc9f2',
             color: '#000',
             fontWeight: '600',
             border: 'none',
             borderRadius: '9999px',
             cursor: 'pointer',
             marginTop: '1rem',
             alignSelf: 'center',
           }}
        >
          Review
        </button>
      </div>

      {/* Right: Markdown Review */}
      <div className="right" style={{
        width: '50%',
        padding: '1rem',
        overflowY: 'auto',
        backgroundColor: '#f5f5dc',
        color: '#000',
      }}>
        <Markdown rehypeplugins={[rehypeHighlight]}>
          {review}
        </Markdown>
      </div>
    </main>
  )
}

import { useEffect } from 'react'

interface EditorProps {
  content: string
  hasOpenFile: boolean
  onChange: (value: string) => void
  onSave: () => void
}

export function Editor({ content, hasOpenFile, onChange, onSave }: EditorProps) {
  // Ctrl+S to save
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        onSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  if (!hasOpenFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#6b6b6b] text-sm">
        Open a file to start editing
      </div>
    )
  }

  return (
    <textarea
      className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 resize-none outline-none leading-relaxed"
      value={content}
      onChange={e => onChange(e.target.value)}
      spellCheck={false}
    />
  )
}

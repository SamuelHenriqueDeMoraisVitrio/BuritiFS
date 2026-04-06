import { useExplorer } from 'buritifs/react'
import { useEditor } from './hooks/useEditor'
import { Sidebar } from './components/Sidebar'
import { Titlebar } from './components/Titlebar'
import { Editor } from './components/Editor'

function App() {
  const explorer = useExplorer('buritifs-editor')
  const { openedFile, content, hasUnsavedChanges, openFile, updateContent, saveFile } = useEditor()

  if (explorer.status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e] text-[#6b6b6b] text-sm">
        Loading…
      </div>
    )
  }

  if (explorer.status === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e] text-[#f48771] text-sm">
        Error: {explorer.error}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm overflow-hidden">
      <Sidebar root={explorer.root} onFileClick={openFile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Titlebar
          filename={openedFile?.name ?? null}
          hasUnsavedChanges={hasUnsavedChanges}
        />
        <Editor
          content={content}
          hasOpenFile={openedFile !== null}
          onChange={updateContent}
          onSave={saveFile}
        />
      </div>
    </div>
  )
}

export default App

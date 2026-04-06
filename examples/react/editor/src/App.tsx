import { useState } from 'react'
import { useExplorer, useAction, type ExplorerFolder, type ListItem } from 'buritifs/react'
import { useEditor } from './hooks/useEditor'
import { Sidebar } from './components/Sidebar'
import { Titlebar } from './components/Titlebar'
import { Editor } from './components/Editor'
import { ContextMenu } from './components/ContextMenu'

interface ContextMenuState {
  x: number
  y: number
  target: ListItem | null
  parentFolder: ExplorerFolder  // parent of target — used to get() the item for rename/delete
  createIn: ExplorerFolder      // folder where new items are created
}

function getNameFromPath(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path
}

function App() {
  const explorer = useExplorer('buritifs-editor')
  const { openedFile, content, hasUnsavedChanges, openFile, updateContent, saveFile } = useEditor()
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const newFileAction = useAction(async () => {
    if (!contextMenu) return { ok: true, error: null }
    const name = window.prompt('File name:')
    if (!name) return { ok: true, error: null }
    return contextMenu.createIn.newFile({ name })
  })

  const newFolderAction = useAction(async () => {
    if (!contextMenu) return { ok: true, error: null }
    const name = window.prompt('Folder name:')
    if (!name) return { ok: true, error: null }
    return contextMenu.createIn.newFolder({ name })
  })

  const renameAction = useAction(async () => {
    if (!contextMenu?.target) return { ok: true, error: null }
    const currentName = getNameFromPath(contextMenu.target.path)
    const newName = window.prompt('New name:', currentName)
    if (!newName || newName === currentName) return { ok: true, error: null }
    const item = await contextMenu.parentFolder.get({ name: currentName })
    if (!item.ok) return item
    return item.rename({ name: newName })
  })

  const deleteAction = useAction(async () => {
    if (!contextMenu?.target) return { ok: true, error: null }
    const name = getNameFromPath(contextMenu.target.path)
    if (!window.confirm(`Delete "${name}"?`)) return { ok: true, error: null }
    const item = await contextMenu.parentFolder.get({ name })
    if (!item.ok) return item
    return item.delete()
  })

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
      <Sidebar
        root={explorer.root}
        onFileClick={openFile}
        onContextMenu={(e, target, targetParent, createIn) =>
          setContextMenu({ x: e.clientX, y: e.clientY, target, parentFolder: targetParent, createIn })
        }
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Titlebar
          filename={openedFile ? getNameFromPath(openedFile.path) : null}
          hasUnsavedChanges={hasUnsavedChanges}
        />
        <Editor
          content={content}
          hasOpenFile={openedFile !== null}
          onChange={updateContent}
          onSave={saveFile}
        />
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onNewFile={newFileAction.run}
          onNewFolder={newFolderAction.run}
          onRename={renameAction.run}
          onDelete={deleteAction.run}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default App

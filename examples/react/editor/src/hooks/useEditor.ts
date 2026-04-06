import { useState, useCallback, useEffect } from 'react'
import type { ExplorerFile, ExplorerFolder } from 'buritifs'

interface EditorState {
  openedFile: ExplorerFile | null
  content: string
  hasUnsavedChanges: boolean
}

const INITIAL_STATE: EditorState = {
  openedFile: null,
  content: '',
  hasUnsavedChanges: false,
}

export function useEditor(root: ExplorerFolder | null) {
  const [state, setState] = useState<EditorState>(INITIAL_STATE)

  const openFile = useCallback(async (file: ExplorerFile) => {
    const result = await file.read()

    if (!result.ok) {
      console.error('Failed to read file:', result.error)
      return
    }

    setState({
      openedFile: file,
      content: result.text,
      hasUnsavedChanges: false,
    })
  }, [])

  const updateContent = useCallback((newContent: string) => {
    setState(prev => ({
      ...prev,
      content: newContent,
      hasUnsavedChanges: true,
    }))
  }, [])

  const saveFile = useCallback(async () => {
    if (!state.openedFile) return
    if (!state.hasUnsavedChanges) return

    const result = await state.openedFile.write({ content: state.content })

    if (!result.ok) {
      console.error('Failed to save file:', result.error)
      return
    }

    setState(prev => ({ ...prev, hasUnsavedChanges: false }))
  }, [state.openedFile, state.content, state.hasUnsavedChanges])

  // React to external changes on the opened file's parent directory.
  // The parent is notified on both delete and rename operations.
  useEffect(() => {
    if (!state.openedFile || !root) return

    const file = state.openedFile
    const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/'
    const tree = root.tree

    const unsubscribe = tree.subscribe(parentPath, async () => {
      const exists = await file.exists()

      if (!exists) {
        // File was deleted or renamed externally — close the editor
        setState(INITIAL_STATE)
        return
      }

      // File still exists. If it was renamed via this same ExplorerFile instance,
      // file.path already reflects the new name. Trigger a re-render so the
      // Titlebar picks up the updated filename.
      setState(prev => ({ ...prev }))
    })

    return unsubscribe
  }, [state.openedFile, root])

  return {
    openedFile: state.openedFile,
    content: state.content,
    hasUnsavedChanges: state.hasUnsavedChanges,
    openFile,
    updateContent,
    saveFile,
  }
}

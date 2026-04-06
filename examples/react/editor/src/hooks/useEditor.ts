import { useState, useCallback } from 'react'
import type { ExplorerFile } from 'buritifs'

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

export function useEditor() {
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

  return {
    openedFile: state.openedFile,
    content: state.content,
    hasUnsavedChanges: state.hasUnsavedChanges,
    openFile,
    updateContent,
    saveFile,
  }
}

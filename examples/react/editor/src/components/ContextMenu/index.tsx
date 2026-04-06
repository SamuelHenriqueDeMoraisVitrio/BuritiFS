import { useEffect } from 'react'
import type { ListItem } from 'buritifs/react'

interface ContextMenuProps {
  x: number
  y: number
  target: ListItem | null
  onNewFile: () => void
  onNewFolder: () => void
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}

export function ContextMenu({ x, y, target, onNewFile, onNewFolder, onRename, onDelete, onClose }: ContextMenuProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function handleMouseDown() {
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed z-50 bg-[#252526] border border-[#3c3c3c] rounded shadow-lg py-1 text-sm text-[#cccccc] min-w-[160px]"
      style={{ top: y, left: x }}
      onMouseDown={e => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-1.5 hover:bg-[#2a2d2e] cursor-pointer"
        onClick={() => { onNewFile(); onClose() }}
      >
        New File
      </button>
      <button
        className="w-full text-left px-4 py-1.5 hover:bg-[#2a2d2e] cursor-pointer"
        onClick={() => { onNewFolder(); onClose() }}
      >
        New Folder
      </button>
      {target !== null && (
        <>
          <div className="border-t border-[#3c3c3c] my-1" />
          <button
            className="w-full text-left px-4 py-1.5 hover:bg-[#2a2d2e] cursor-pointer"
            onClick={() => { onRename(); onClose() }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-4 py-1.5 hover:bg-[#2a2d2e] hover:text-[#f48771] cursor-pointer"
            onClick={() => { onDelete(); onClose() }}
          >
            Delete
          </button>
        </>
      )}
    </div>
  )
}

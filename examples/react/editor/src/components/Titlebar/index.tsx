interface TitlebarProps {
  filename: string | null
  hasUnsavedChanges: boolean
  onSave: () => void
}

export function Titlebar({ filename, hasUnsavedChanges, onSave }: TitlebarProps) {
  const title = filename ?? 'No file open'

  return (
    <div className="h-9 bg-[#2d2d2d] border-b border-[#3c3c3c] flex items-center px-4 gap-2 text-sm text-[#cccccc] shrink-0">
      <span>{title}</span>
      {hasUnsavedChanges && (
        <>
          <span className="text-[#e2c08d]" title="Unsaved changes">●</span>
          <button
            className="text-xs px-2 py-0.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded"
            onClick={onSave}
          >
            Save
          </button>
        </>
      )}
    </div>
  )
}

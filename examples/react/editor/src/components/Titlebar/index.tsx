interface TitlebarProps {
  filename: string | null
  hasUnsavedChanges: boolean
}

export function Titlebar({ filename, hasUnsavedChanges }: TitlebarProps) {
  const title = filename ?? 'No file open'
  const indicator = hasUnsavedChanges ? '●' : ''

  return (
    <div className="h-9 bg-[#2d2d2d] border-b border-[#3c3c3c] flex items-center px-4 gap-2 text-sm text-[#cccccc] shrink-0">
      <span>{title}</span>
      {indicator && (
        <span className="text-[#e2c08d]" title="Unsaved changes">
          {indicator}
        </span>
      )}
    </div>
  )
}

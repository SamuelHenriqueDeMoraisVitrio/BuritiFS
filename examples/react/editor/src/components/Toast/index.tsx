interface ToastProps {
  message: string
  visible: boolean
}

export function Toast({ message, visible }: ToastProps) {
  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-[#3c1f1f] border border-[#f48771] text-[#f48771] text-sm px-4 py-2.5 rounded shadow-lg z-50 max-w-xs">
      {message}
    </div>
  )
}

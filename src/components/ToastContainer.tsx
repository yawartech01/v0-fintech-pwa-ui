import { useEffect, useState } from 'react'
import { X, CheckCircle2, XCircle, Info } from 'lucide-react'
import { toastManager } from '@/lib/toast'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return toastManager.subscribe(setToasts)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex flex-col gap-2 max-w-sm mx-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm
            border animate-in slide-in-from-right
            ${
              toast.type === 'success'
                ? 'bg-success/90 border-success text-success-foreground'
                : toast.type === 'error'
                  ? 'bg-destructive/90 border-destructive text-destructive-foreground'
                  : 'bg-card/90 border-border'
            }
          `}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 mt-0.5" />}
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            onClick={() => toastManager.remove(toast.id)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

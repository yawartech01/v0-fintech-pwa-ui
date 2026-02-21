// Simple toast notification system
type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

class ToastManager {
  private toasts: Toast[] = []
  private listeners: Set<(toasts: Toast[]) => void> = new Set()

  show(message: string, type: ToastType = 'info') {
    const toast: Toast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      message,
      type,
    }

    this.toasts.push(toast)
    this.notify()

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.remove(toast.id)
    }, 3000)
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.notify()
  }

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]))
  }
}

export const toastManager = new ToastManager()

export function showToast(message: string, type: ToastType = 'info') {
  toastManager.show(message, type)
}

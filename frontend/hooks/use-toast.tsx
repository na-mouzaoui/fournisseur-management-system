'use client'

import * as React from 'react'

type ToastVariant = 'default' | 'destructive'

interface Toast {
  id: number
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextType {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback(
    (opts: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, ...opts }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-4 text-sm shadow-lg"
            style={{
              borderColor: t.variant === 'destructive' ? '#ef4444' : '#2db34b',
            }}
          >
            <div>
              <p className="font-semibold text-gray-900">{t.title}</p>
              {t.description && <p className="mt-1 text-gray-600">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
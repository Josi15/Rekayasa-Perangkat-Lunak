import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg">
            {t.type === 'error' ? <XCircle className="mt-0.5 size-4 text-red-500" /> : <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />}
            <span className="flex-1 text-slate-700">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Tutup"><X className="size-4 text-slate-400" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

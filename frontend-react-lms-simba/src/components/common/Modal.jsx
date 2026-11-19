import { X } from 'lucide-react'

export function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Tutup"><X className="size-5 text-slate-500" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmationDialog({ open, title, message, confirmLabel = 'Ya, lanjutkan', tone = 'danger', onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Batal</button>
        <button onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${tone === 'primary' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-red-600 hover:bg-red-700'}`}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}

import { Loader2, Inbox, AlertTriangle } from 'lucide-react'

export function LoadingState({ label = 'Memuat data...' }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-slate-500"><Loader2 className="size-5 animate-spin" />{label}</div>
}
export function EmptyState({ title = 'Belum ada data', description }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Inbox className="size-10 text-slate-300" />
      <p className="mt-2 font-medium text-slate-700">{title}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  )
}
export function ErrorState({ message = 'Terjadi kesalahan.', onRetry }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertTriangle className="size-10 text-red-400" />
      <p className="mt-2 text-slate-700">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">Coba lagi</button>}
    </div>
  )
}

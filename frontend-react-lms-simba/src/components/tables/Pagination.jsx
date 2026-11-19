import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pages, onChange }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>Halaman {page} dari {pages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-300 p-1.5 disabled:opacity-40" aria-label="Sebelumnya"><ChevronLeft className="size-4" /></button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-300 p-1.5 disabled:opacity-40" aria-label="Berikutnya"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  )
}

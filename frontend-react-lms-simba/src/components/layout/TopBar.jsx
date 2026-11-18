import { Search } from 'lucide-react'

export default function TopBar({ query, onQuery, placeholder = 'Cari...', name, subtitle }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
      <div className="relative w-full max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="search" aria-label={placeholder} placeholder={placeholder} value={query} onChange={(e) => onQuery(e.target.value)} className="w-full rounded-lg bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-200" />
      </div>
      {name && (
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden text-right text-xs sm:block"><p className="font-bold text-slate-900">{name}</p><p className="text-slate-600">{subtitle}</p></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-700">{name[0]}</span>
        </div>
      )}
    </div>
  )
}

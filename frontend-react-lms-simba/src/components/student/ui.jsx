import { File, FileText, Presentation, Video } from 'lucide-react'
import { card } from '../../utils/styles.js'

export function Card({ title, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`${card} ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">{Icon && <Icon className="size-4 text-brand-600" />}{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Eyebrow({ children }) {
  return <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600">{children}</p>
}

const icons = { PDF: [FileText, 'text-red-500 bg-red-50'], DOCX: [FileText, 'text-blue-600 bg-blue-50'], PPTX: [Presentation, 'text-orange-500 bg-orange-50'], MP4: [Video, 'text-pink-500 bg-pink-50'] }
export function FileTypeIcon({ type }) {
  const [Icon, cls] = icons[type] ?? [File, 'text-slate-500 bg-slate-100']
  return <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${cls}`}><Icon className="size-4" /></span>
}

export function Pill({ children, tone = 'green' }) {
  const t = { green: 'bg-brand-50 text-brand-700', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 text-slate-600' }[tone]
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>
}

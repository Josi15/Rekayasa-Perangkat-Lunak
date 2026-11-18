import { Link } from 'react-router-dom'
import { Bell, ArrowRight } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'
import { timeAgo } from '../../../utils/format'

const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function RecentSubmissions({ items }) {
  return (
    <section className="panel space-y-4">
      <h2 className="flex items-center gap-2 font-bold"><Bell size={18} className="text-brand-700" />Pengumpulan Tugas Terbaru<span className="ml-auto h-2.5 w-2.5 rounded-full bg-red-600" /></h2>
      {items.length === 0 ? <EmptyState title="Belum ada pengumpulan" /> : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id}>
              <Link to={`/teacher/assignments/${s.assignmentId}`} className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 hover:bg-brand-100">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-200 text-xs font-bold text-brand-700">{initials(s.name)}</span>
                <span className="min-w-0 flex-1 text-xs"><span className="flex justify-between gap-2"><b className="text-sm">{s.name}</b><span className="shrink-0 text-slate-400">{timeAgo(s.submittedAt)}</span></span><span className="block truncate text-slate-600">{s.file}</span><span className="mt-1 block font-semibold text-brand-700">{s.className}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/teacher/assignments" className="flex items-center justify-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Buka Semua Antrean Tugas <ArrowRight size={14} /></Link>
    </section>
  )
}

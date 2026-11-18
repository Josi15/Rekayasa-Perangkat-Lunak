import { Link } from 'react-router-dom'
import { CalendarClock, Zap } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'
import { formatDeadline } from '../../../utils/format'

export default function ActiveBanner({ assignments, selectedId, onSelect, submitted, total, onQuick }) {
  const a = assignments.find((x) => x.id === selectedId)
  if (!a) return <section className="panel"><EmptyState title="Belum ada tugas dipublikasikan untuk kelas ini" action={<Link to="/teacher/assignments/new" className="btn-primary">Buat Penugasan Baru</Link>} /></section>
  const rest = total - submitted
  return (
    <section className="grid gap-4 rounded-2xl bg-brand-100/70 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs"><span className="rounded-full bg-brand-600 px-3 py-1 font-semibold text-white">Tugas Sedang Aktif</span><span className="flex items-center gap-1.5 text-slate-700"><CalendarClock size={14} />Tenggat: {formatDeadline(a.dueDate)}</span></div>
        <h2 className="text-2xl font-extrabold">{a.title}</h2>
        {assignments.length > 1 && <select aria-label="Pilih tugas" className="rounded-lg bg-white px-3 py-2 text-sm" value={selectedId} onChange={(e) => onSelect(Number(e.target.value))}>{assignments.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>}
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 text-xs">
        <div className="w-40 space-y-1"><p className="font-medium">Progres Pengumpulan</p><div className="h-2 rounded-full bg-brand-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${total ? (submitted / total) * 100 : 0}%` }} /></div>
          <p className="text-slate-500">{rest > 0 ? `Sisa ${rest} siswa belum mengirimkan draf` : 'Semua siswa sudah mengumpulkan'}</p></div>
        <b className="text-brand-700">{submitted} / {total} Siswa</b>
        <button className="btn-primary" onClick={onQuick}><Zap size={14} /> Mulai Koreksi Cepat</button>
      </div>
    </section>
  )
}

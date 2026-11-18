import { Link } from 'react-router-dom'
import { Clock, MapPin, UserCheck, FileQuestion, FolderOpen } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'

export default function ActiveSession({ session: s }) {
  const { notify } = useToast()
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold tracking-wide text-brand-700"><span className="h-3 w-3 rounded-full bg-brand-600" />SESI KBM SEDANG BERLANGSUNG</p>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Tersisa {s.remaining} lagi</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold">{s.title}</h2>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><Clock size={15} />{s.period}</span><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{s.room}</span></p>
            <p className="text-sm text-slate-600">Topik: {s.topic}</p>
          </div>
          <div className="w-full text-xs sm:w-56">
            <div className="mb-1 flex justify-between"><span className="text-slate-500">Progres Jam</span><b className="text-brand-700">{s.progress}% Selesai</b></div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${s.progress}%` }} /></div>
            <p className="mt-1 text-right text-slate-400">{s.clock}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 bg-brand-50 px-6 py-4 sm:px-8">
        <Link to="/teacher/attendance" className="btn-primary"><UserCheck size={16} /> Buka Presensi KBM</Link>
        <button className="btn-secondary" onClick={() => notify('Simulasi: integrasi Google Form belum tersedia.', 'info')}><FileQuestion size={16} /> Mulai Sesi Google Form</button>
        <Link to="/teacher/materials" className="ml-auto inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700"><FolderOpen size={16} /> Bahan Ajar</Link>
      </div>
    </section>
  )
}

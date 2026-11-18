import { Link } from 'react-router-dom'
import { IdCard, Info, FileText } from 'lucide-react'

export default function HomeroomPanel({ homeroom: h }) {
  const pct = h.total ? ((h.present / h.total) * 100).toFixed(1) : '0.0'
  return (
    <section className="panel space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-100 p-2.5 text-brand-700"><IdCard size={20} /></div>
        <div className="flex-1"><h2 className="font-bold">Panel Wali Kelas</h2><p className="text-xs text-slate-500">Kelas Binaan: {h.name}</p></div>
        <Link to={`/teacher/classes/${h.classId}`} className="rounded-md bg-brand-200 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100">{h.total} Siswa</Link>
      </div>
      <div className="space-y-3 rounded-xl bg-brand-50 p-4">
        <p className="flex justify-between text-sm"><span>Presensi Hari Ini:</span><b>{pct}% Hadir</b></p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Hadir', h.present, 'text-brand-700'], ['Izin', h.permit, 'text-slate-700'], ['Sakit', h.sick, 'text-red-700']].map(([l, v, c]) => (
            <div key={l} className="rounded-lg bg-white py-2"><p className="text-xs text-slate-500">{l}</p><p className={`text-2xl font-bold ${c}`}>{v}</p></div>
          ))}
        </div>
        <p className="flex gap-2 text-xs text-slate-500"><Info size={14} className="mt-0.5 shrink-0 text-red-600" />{h.note}</p>
      </div>
      <Link to="/teacher/attendance" className="flex items-center justify-center gap-2 rounded-lg bg-brand-100 py-2.5 text-sm font-semibold text-slate-800 hover:bg-brand-200"><FileText size={16} /> Cek Absensi Rombel</Link>
    </section>
  )
}

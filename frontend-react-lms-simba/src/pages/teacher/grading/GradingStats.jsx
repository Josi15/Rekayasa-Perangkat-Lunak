import { Link } from 'react-router-dom'
import { ClipboardClock, MessageSquareText, Timer } from 'lucide-react'

const Label = ({ children }) => <p className="text-xs uppercase tracking-wide text-slate-500">{children}</p>

export default function GradingStats({ active, pending, onTimePct }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="panel space-y-3">
        <div className="flex justify-between"><div><Label>Total Tugas Aktif</Label><p className="mt-2 text-3xl font-extrabold">{active} <span className="text-base font-normal text-slate-600">Penugasan</span></p></div><span className="h-fit rounded-xl bg-brand-100 p-3 text-brand-700"><ClipboardClock size={22} /></span></div>
        <Link to="/teacher/assignments/manage" className="text-xs font-semibold text-brand-700 hover:underline">Kelola daftar tugas →</Link>
      </div>
      <div className="panel relative space-y-3 overflow-hidden">
        <div className="flex justify-between"><div><Label>Berkas Menunggu Koreksi</Label><p className="mt-2 text-3xl font-extrabold text-brand-700">{pending} <span className="text-base font-normal text-slate-800">Berkas Masuk</span></p></div>
          <div className="flex h-fit items-center gap-2">{pending > 0 && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">Prioritas</span>}<span className="rounded-xl bg-brand-200 p-3 text-brand-700"><MessageSquareText size={22} /></span></div></div>
        <p className={`text-xs font-semibold ${pending > 0 ? 'text-red-700' : 'text-brand-700'}`}>{pending > 0 ? '! Target koreksi hari ini' : 'Semua berkas sudah diperiksa'}</p>
      </div>
      <div className="panel space-y-3">
        <div className="flex justify-between"><div><Label>Ketepatan Waktu Kumpul</Label><p className="mt-2 text-3xl font-extrabold">{onTimePct ?? '-'}{onTimePct != null && '%'} <span className="text-base font-normal text-slate-600">Rata-rata Kelas</span></p></div><span className="h-fit rounded-xl bg-brand-100 p-3 text-brand-700"><Timer size={22} /></span></div>
        <div className="h-2 rounded-full bg-brand-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${onTimePct ?? 0}%` }} /></div>
      </div>
    </div>
  )
}

import { Timer, Users, BarChart3, CloudOff, CloudUpload } from 'lucide-react'

const Label = ({ children }) => <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{children}</p>

export default function QuizStats({ stats: s }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="panel space-y-3"><div className="flex justify-between"><div><Label>Kuis Aktif Berjalan</Label><p className="mt-2 text-4xl font-extrabold">{s.running} <span className="text-base font-normal text-slate-600">Asesmen</span></p></div><span className="h-fit rounded-xl bg-brand-100 p-3 text-brand-700"><Timer size={22} /></span></div>
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-600"><CloudOff size={13} />Mode simulasi · Google Forms API belum tersambung</p></div>
      <div className="panel space-y-3"><div className="flex justify-between"><div><Label>Total Siswa Mengerjakan</Label><p className="mt-2 text-4xl font-extrabold">{s.done} <span className="text-base font-normal text-slate-600">/ {s.total} Siswa</span></p></div><span className="h-fit rounded-xl bg-brand-200 p-3 text-brand-700"><Users size={22} /></span></div>
        <div className="flex items-center gap-3"><div className="h-2 flex-1 rounded-full bg-brand-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${s.pct}%` }} /></div><b className="text-xs text-brand-700">{s.pct}%</b></div></div>
      <div className="panel space-y-3"><div className="flex justify-between"><div><Label>Rerata Nilai Asesmen</Label><p className="mt-2 text-4xl font-extrabold">{s.avg ?? '-'} <span className="text-base font-normal text-slate-600">/ 100</span></p></div><span className="h-fit rounded-xl bg-brand-100 p-3 text-brand-700"><BarChart3 size={22} /></span></div>
        <p className="flex items-center gap-2 text-xs text-slate-600"><CloudUpload size={13} />Sinkron ke Leger lewat menu aksi kuis</p></div>
    </div>
  )
}

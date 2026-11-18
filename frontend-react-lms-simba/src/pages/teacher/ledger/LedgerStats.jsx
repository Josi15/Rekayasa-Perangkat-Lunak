import { BarChart3, ShieldCheck, Award, TrendingUp } from 'lucide-react'
import { ledgerConfig } from '../../../data/ledger'

const Label = ({ children }) => <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{children}</p>

export default function LedgerStats({ s }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="panel space-y-4"><div className="flex justify-between"><div><Label>Rata-rata Kelas</Label><p className="mt-2 text-4xl font-extrabold text-brand-700">{s.avg ?? '-'} <span className="text-xs font-normal text-slate-500">/100</span></p></div><span className="h-fit rounded-xl bg-brand-100 p-3 text-brand-700"><BarChart3 size={22} /></span></div>
        <p className="flex items-center justify-between text-xs"><span className="inline-flex items-center gap-1.5 font-semibold text-brand-700"><TrendingUp size={13} />{s.delta > 0 ? '+' : ''}{s.delta} Poin</span><span className="text-slate-600">Dari PTS Semester Lalu</span></p></div>
      <div className="panel space-y-4"><div className="flex justify-between"><div><Label>Ketuntasan Siswa</Label><p className="mt-2 text-4xl font-extrabold">{s.tuntasPct}%</p></div><span className="h-fit rounded-xl bg-brand-200 p-3 text-brand-700"><ShieldCheck size={22} /></span></div>
        <p className="flex items-center justify-between text-xs"><b className="text-brand-700">{s.tuntas} dari {s.n} Siswa Tuntas</b><span className="text-slate-600">Di Atas Batas KKTP {ledgerConfig.kktp.toFixed(1)}</span></p></div>
      <div className="panel space-y-4"><div className="flex justify-between"><div><Label>Skor Tertinggi Siswa</Label><p className="mt-2 text-4xl font-extrabold text-brand-700">{s.top?.na ?? '-'}</p></div><span className="h-fit rounded-xl bg-brand-100 p-3 text-brand-700"><Award size={22} /></span></div>
        <p className="flex items-center justify-between text-xs"><b>{s.top?.name}</b><span className="text-slate-600">NISN: {s.top?.nisn}</span></p></div>
    </div>
  )
}

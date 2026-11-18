import { Link } from 'react-router-dom'
import { FileText, Users, FileCheck2, FlaskConical, CheckCheck, ArrowRight } from 'lucide-react'

function Ring({ pct }) {
  const r = 26, c = 2 * Math.PI * r
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${pct}%`}>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-brand-100" />
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-brand-600" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)} transform="rotate(-90 32 32)" />
      <text x="32" y="36" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">{pct}%</text>
    </svg>
  )
}
const Row = ({ icon: I, label, children }) => <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm"><span className="flex items-center gap-3 text-slate-600"><I size={16} />{label}</span><b className="text-right">{children}</b></div>

export default function SkPanel({ jp, standard, homeroom, semester }) {
  const pct = Math.round((jp / standard) * 100)
  return (
    <section id="sk" className="panel space-y-4">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-100 p-2.5 text-brand-700"><FileText size={18} /></span><div><h2 className="font-bold">SK Pembagian Tugas KBM</h2><p className="text-xs text-slate-600">Semester {semester}</p></div></div><span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-xs font-bold text-brand-700">Valid</span></div>
      <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4"><div><p className="text-xs text-slate-600">Total Beban Mengajar</p><p className="text-3xl font-extrabold">{jp} <span className="text-sm font-normal text-slate-600">JP / pekan</span></p>
        {jp >= standard && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-700"><CheckCheck size={13} />Target Sertifikasi {standard} JP terpenuhi (+{jp - standard} JP)</p>}</div><Ring pct={pct} /></div>
      <Row icon={Users} label="Rombel Binaan (Wali Kelas)">{homeroom.name} ({homeroom.total} Siswa)</Row>
      <Row icon={FileCheck2} label="Nomor SK Mengajar"><span className="font-mono text-xs">No. 421.3/089/SMAN1/2026</span></Row>
      <Row icon={FlaskConical} label="Tugas Tambahan">Koord. Lab Komputer</Row>
      <Link to="/teacher/schedule" className="flex items-center justify-center gap-1 pt-1 text-sm font-semibold text-brand-700 hover:underline">Lihat Jadwal Mengajar & Rombel Lengkap <ArrowRight size={14} /></Link>
    </section>
  )
}

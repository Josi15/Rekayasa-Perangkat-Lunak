import { Link } from 'react-router-dom'
import { Clock, ClipboardCheck, Users, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react'

const Label = ({ children }) => <p className="text-sm uppercase tracking-wide text-slate-500">{children}</p>
const IconBox = ({ children, tone = 'text-brand-600 bg-brand-100' }) => <div className={`rounded-xl p-3 ${tone}`}>{children}</div>
const Chip = ({ icon: Icon, children }) => <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-100 px-2.5 py-1.5 text-xs font-semibold text-brand-700"><Icon size={14} />{children}</span>

export default function StatCards({ home }) {
  const { workload: w, queue: q, attendance: a } = home
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="panel space-y-5">
        <div className="flex justify-between"><div><Label>Beban Kerja Guru</Label><p className="mt-2 text-4xl font-extrabold">{w.jp} <span className="text-base font-normal text-slate-500">JP / pekan</span></p></div><IconBox><Clock size={22} /></IconBox></div>
        <div className="flex items-center justify-between gap-2"><Chip icon={CheckCircle2}>Status Beban Terpenuhi ({w.percent}%)</Chip><span className="text-xs text-slate-500">Target: {w.target} JP</span></div>
      </div>
      <div className="panel space-y-5">
        <div className="flex justify-between"><div><Label>Antrean Evaluasi</Label><p className="mt-2 text-4xl font-extrabold">{q.count} <span className="text-base font-normal text-slate-500">Berkas Masuk</span></p></div><IconBox tone="bg-red-50 text-red-700"><ClipboardCheck size={22} /></IconBox></div>
        <div className="flex items-center justify-between gap-2 text-xs"><span>Menunggu koreksi dari <b>{q.classCount}</b> kelas</span>
          <Link to="/teacher/assignments" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">Periksa Sekarang <ArrowRight size={14} /></Link></div>
      </div>
      <div className="panel space-y-5">
        <div className="flex justify-between"><div><Label>Rerata Presensi Kelas</Label><p className="mt-2 text-4xl font-extrabold">{a.average}%</p></div><IconBox><Users size={22} /></IconBox></div>
        <div className="flex items-center justify-between gap-2"><Chip icon={TrendingUp}>Kondisi Sangat Baik</Chip><span className="text-xs text-slate-500">{a.classes} Rombel Ampuan</span></div>
      </div>
    </div>
  )
}

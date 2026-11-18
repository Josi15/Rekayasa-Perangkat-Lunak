import { ListChecks, Clock, AlarmClock, FileCheck2, Copy, RefreshCw, Eye } from 'lucide-react'
import { formatDue } from '../../../utils/format'

export default function FeaturedQuiz({ quiz: q, onSync, onResponses, onCopy }) {
  const pct = q.total ? Math.round((q.done / q.total) * 100) : 0
  return (
    <section className="grid gap-5 rounded-2xl bg-gradient-to-br from-brand-200/80 to-brand-100 p-6 lg:grid-cols-[1fr_auto]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs"><span className="rounded-full bg-brand-600 px-3 py-1 font-bold uppercase tracking-wide text-white">● Sedang Berlangsung</span><span className="text-slate-700">• {q.rombel}</span></div>
        <h2 className="max-w-xl text-2xl font-extrabold">{q.title}</h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700"><span className="inline-flex items-center gap-1.5"><ListChecks size={14} />{q.questionCount} Butir {q.type}</span><span className="inline-flex items-center gap-1.5"><Clock size={14} />Durasi: {q.durationMin} Menit</span><span className="inline-flex items-center gap-1.5 text-red-700"><AlarmClock size={14} />Batas Akhir: {formatDue(q.dueAt)} WIB</span></p>
        {q.formUrl && <div className="flex max-w-md items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs"><FileCheck2 size={14} className="text-brand-700" /><span className="flex-1 truncate font-mono">{q.formUrl.replace('https://', '')}</span><button aria-label="Salin tautan form" onClick={() => onCopy(q.formUrl, 'Tautan form disalin.')}><Copy size={14} /></button></div>}
      </div>
      <div className="space-y-3 lg:w-80">
        <div className="rounded-xl bg-white p-4 text-xs"><div className="mb-2 flex justify-between"><span>Progres Pengumpulan</span><b className="text-brand-700">{q.done} / {q.total} Siswa ({pct}%)</b></div>
          <div className="h-2 rounded-full bg-brand-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div><p className="mt-2 text-right text-slate-500">{q.total - q.done} siswa belum menyelesaikan</p></div>
        <div className="flex flex-wrap gap-2"><button className="btn-primary" onClick={() => onSync(q)}><RefreshCw size={14} /> Tarik Nilai Otomatis ke Leger</button>
          <button className="btn-secondary" onClick={() => onResponses(q)}><Eye size={14} /> Respon Siswa</button>
          {q.formUrl && <button className="btn-secondary px-2.5" aria-label="Salin tautan" onClick={() => onCopy(q.formUrl, 'Tautan form disalin.')}><Copy size={14} /></button>}</div>
      </div>
    </section>
  )
}

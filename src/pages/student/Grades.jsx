import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Clock, ClipboardList, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatisticCard from '../../components/common/StatisticCard.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import ScoreChart from '../../components/student/ScoreChart.jsx'
import FilterSelect from '../../components/student/FilterSelect.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentGrades } from '../../services/index.js'
import { fmtDate } from '../../utils/date.js'

export default function Grades() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentGrades.get(user.id), [user.id]))
  return (
    <>
      <PageHeader title="Nilai" description="Nilai tugas per kelas beserta feedback guru." breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Nilai' }]} />
      <AsyncBoundary state={state}>{(g) => <Content g={g} />}</AsyncBoundary>
    </>
  )
}

function Content({ g }) {
  const [course, setCourse] = useState('all')
  const s = g.summary
  const courses = g.courses.filter((c) => course === 'all' || String(c.id) === course)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Tugas dinilai" value={s.gradedCount} icon={Award} />
        <StatisticCard label="Menunggu penilaian" value={s.awaitingCount} icon={Clock} />
        <StatisticCard label="Belum dikumpulkan" value={s.notSubmittedCount} icon={ClipboardList} />
        <StatisticCard label="Rata-rata tugas dinilai" value={s.average ?? '-'} icon={TrendingUp} />
      </div>
      <p className="text-xs text-slate-500">Rata-rata hanya ringkasan nilai tugas yang sudah dinilai (tertinggi {s.highest ?? '-'}, terendah {s.lowest ?? '-'}). Ini bukan nilai akhir; aturan nilai akhir belum ditetapkan sekolah.</p>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold text-slate-900">Perkembangan nilai tugas</h2>
        {g.trend.length === 0 ? <EmptyState title="Belum ada nilai" /> : <ScoreChart items={g.trend} />}
      </section>
      <div><FilterSelect label="Filter kelas" value={course} onChange={setCourse} options={[['all', 'Semua kelas'], ...g.courses.map((c) => [String(c.id), c.name])]} /></div>
      {courses.map((c) => (
        <section key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-slate-900">{c.name} <span className="text-sm font-normal text-slate-500">· {c.teacher}</span></h2>
            <span className="text-sm text-slate-600">Rata-rata tugas dinilai: <b>{c.average ?? '-'}</b></span>
          </div>
          {c.graded.length + c.awaiting.length + c.notSubmitted.length === 0 ? <EmptyState title="Belum ada tugas" /> : (
            <ul className="divide-y divide-slate-100 text-sm">
              {c.graded.map((t) => (
                <li key={t.id} className="py-2"><Link to={`/student/tasks/${t.id}`} className="flex justify-between gap-3 hover:text-brand-600"><span className="font-medium text-slate-900">{t.title}</span><b>{t.score}/{t.maxScore}</b></Link>
                  <p className="text-slate-600">Feedback: {t.feedback}</p><p className="text-xs text-slate-400">Dinilai {fmtDate(t.gradedAt)}</p></li>
              ))}
              {c.awaiting.map((t) => <li key={t.id} className="flex justify-between py-2"><Link to={`/student/tasks/${t.id}`} className="font-medium text-slate-900 hover:text-brand-600">{t.title}</Link><span className="text-blue-700">Menunggu penilaian</span></li>)}
              {c.notSubmitted.map((t) => <li key={t.id} className="flex justify-between py-2"><Link to={`/student/tasks/${t.id}`} className="font-medium text-slate-900 hover:text-brand-600">{t.title}</Link><span className={t.status === 'overdue' ? 'text-red-600' : 'text-amber-700'}>{t.status === 'overdue' ? 'Belum dikumpulkan (terlambat)' : 'Belum dikumpulkan'}</span></li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

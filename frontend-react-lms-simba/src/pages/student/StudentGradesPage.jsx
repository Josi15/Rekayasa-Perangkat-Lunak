import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Hourglass, ClipboardList, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatisticCard from '../../components/common/StatisticCard'
import EmptyState from '../../components/common/EmptyState'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import FilterSelect from '../../components/student/FilterSelect'
import ScoreBars from '../../components/student/ScoreBars'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { studentService } from '../../services'
import { formatDate } from '../../utils/format'
import { taskState, average } from '../../utils/student'

const byDate = (a, b) => String(b.gradedAt ?? '').localeCompare(String(a.gradedAt ?? ''))

export default function StudentGradesPage() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => Promise.all([studentService.listGrades(user.id), studentService.listAssignments(user.id)]), [user.id]))
  return (
    <>
      <PageHeader title="Nilai" description="Nilai per mata pelajaran beserta feedback guru." breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Nilai' }]} />
      <AsyncBoundary state={state}>{([grades, assignments]) => <Content grades={grades} assignments={assignments} />}</AsyncBoundary>
    </>
  )
}

function Content({ grades, assignments }) {
  const [subject, setSubject] = useState('all')
  const [now] = useState(() => Date.now())
  const { waiting, missing } = useMemo(() => ({
    waiting: assignments.filter((a) => taskState(a, now) === 'submitted'),
    missing: assignments.filter((a) => ['todo', 'overdue'].includes(taskState(a, now))),
  }), [assignments, now])
  const scores = grades.map((g) => g.score)
  const names = useMemo(() => [...new Set([...grades, ...waiting, ...missing].map((x) => x.subjectName))].sort(), [grades, waiting, missing])
  const trend = useMemo(() => [...grades].sort(byDate).slice(0, 8).reverse().map((g) => ({ id: g.id, title: g.assignmentTitle, score: g.score })), [grades])
  const sections = names.filter((n) => subject === 'all' || n === subject)
  if (grades.length + waiting.length + missing.length === 0) return <div className="card"><EmptyState title="Belum ada nilai" description="Nilai akan tampil setelah tugas Anda dinilai guru." /></div>
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Nilai tercatat" value={grades.length} icon={Award} />
        <StatisticCard label="Menunggu penilaian" value={waiting.length} icon={Hourglass} />
        <StatisticCard label="Belum dikumpulkan" value={missing.length} icon={ClipboardList} />
        <StatisticCard label="Rata-rata nilai" value={scores.length ? `${average(scores)} / 100` : '-'} icon={TrendingUp} />
      </div>
      <p className="text-xs text-slate-500">{scores.length ? `Tertinggi ${Math.max(...scores)}, terendah ${Math.min(...scores)}. ` : ''}Rata-rata hanyalah ringkasan nilai yang tercatat, bukan nilai akhir (aturan nilai akhir ditetapkan sekolah).</p>
      {trend.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Perkembangan nilai terbaru</h2>
          <ScoreBars items={trend} />
        </section>
      )}
      <FilterSelect label="Filter mata pelajaran" value={subject} onChange={setSubject} options={[['all', 'Semua mata pelajaran'], ...names.map((n) => [n, n])]} />
      {sections.map((name) => {
        const gs = grades.filter((g) => g.subjectName === name).sort(byDate)
        const avg = average(gs.map((g) => g.score))
        const ws = waiting.filter((a) => a.subjectName === name)
        const ms = missing.filter((a) => a.subjectName === name)
        return (
          <section key={name} className="card p-5" aria-label={`Nilai ${name}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-slate-900">{name}</h2>
              <span className="text-sm text-slate-600">{avg === null ? 'Belum ada nilai' : `Rata-rata ${avg}`}</span>
            </div>
            <ul className="divide-y divide-slate-100 text-sm">
              {gs.map((g) => (
                <li key={g.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    {g.assignmentId ? <Link to={`/student/assignments/${g.assignmentId}`} className="font-medium text-slate-900 hover:text-brand-600">{g.assignmentTitle}</Link> : <span className="font-medium text-slate-900">{g.assignmentTitle}</span>}
                    <b className="text-slate-900">{g.score}</b>
                  </div>
                  {g.feedback && <p className="mt-1 text-slate-600"><span className="text-xs uppercase tracking-wide text-slate-400">Feedback </span><span>{g.feedback}</span></p>}
                  {g.gradedAt && <p className="text-xs text-slate-400">Dinilai {formatDate(g.gradedAt)}</p>}
                </li>
              ))}
              {ws.map((a) => <li key={a.id} className="flex justify-between gap-3 py-3"><Link to={`/student/assignments/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">{a.title}</Link><span className="text-blue-700">Menunggu penilaian</span></li>)}
              {ms.map((a) => <li key={a.id} className="flex justify-between gap-3 py-3"><Link to={`/student/assignments/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">{a.title}</Link><span className={taskState(a, now) === 'overdue' ? 'text-red-600' : 'text-amber-700'}>Belum dikumpulkan</span></li>)}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

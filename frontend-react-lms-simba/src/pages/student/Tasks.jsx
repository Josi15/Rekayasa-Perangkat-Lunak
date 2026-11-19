import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { EmptyState } from '../../components/common/States.jsx'
import SearchBar from '../../components/tables/SearchBar.jsx'
import Chips from '../../components/student/Chips.jsx'
import TaskStatusBadge from '../../components/student/TaskStatusBadge.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { Card, Eyebrow } from '../../components/student/ui.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentTasks } from '../../services/index.js'
import { fmtDate, fmtDateTime, timeLeft } from '../../utils/date.js'

const FILTERS = [['all', 'Semua'], ['todo', 'Belum Dikerjakan'], ['submitted', 'Terkumpul'], ['graded', 'Dinilai'], ['late', 'Terlambat']]
const match = { all: () => true, todo: (t) => t.status === 'todo' || t.status === 'overdue', submitted: (t) => t.status === 'submitted', graded: (t) => t.status === 'graded', late: (t) => t.late }

export default function Tasks() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentTasks.list(user.id), [user.id]))
  return (
    <>
      <div className="mb-5"><Eyebrow>Akademik</Eyebrow><h1 className="text-3xl font-extrabold text-slate-900">Tugas & Berkas</h1></div>
      <AsyncBoundary state={state}>{(tasks) => <TaskList tasks={tasks} />}</AsyncBoundary>
    </>
  )
}

function TaskList({ tasks }) {
  const [params] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState(params.get('q') ?? '')
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const open = (t) => (t.status === 'todo' || t.status === 'overdue' ? 0 : 1)
    return tasks.filter((t) => match[filter](t) && (!s || [t.title, t.courseName].some((v) => v.toLowerCase().includes(s))))
      .sort((a, b) => open(a) - open(b) || (open(a) === 0 ? new Date(a.due) - new Date(b.due) : new Date(b.due) - new Date(a.due)))
  }, [tasks, filter, q])
  const recent = tasks.filter((t) => t.submission?.submittedAt).sort((a, b) => new Date(b.submission.submittedAt) - new Date(a.submission.submittedAt)).slice(0, 2)
  return (
    <div className="space-y-5">
      <Chips value={filter} onChange={setFilter} options={FILTERS.map(([v, l]) => [v, l, tasks.filter(match[v]).length])} />
      <SearchBar value={q} onChange={setQ} placeholder="Cari tugas atau mata pelajaran..." />
      {shown.length === 0 ? <Card><EmptyState title="Tugas tidak ditemukan" description="Ubah filter atau kata kunci." /></Card> : (
        <div className="space-y-2">
          {shown.map((t) => (
            <Link key={t.id} to={`/student/tasks/${t.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-simba-line bg-white p-4 shadow-sm hover:border-brand-500">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">{t.courseName}</p>
                <p className="font-semibold text-slate-900">{t.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock className="size-3.5" />Batas {fmtDateTime(t.due)}{t.status === 'todo' && ` · ${timeLeft(t.due)}`}</p>
              </div>
              <div className="text-right"><TaskStatusBadge task={t} />{t.status === 'graded' && <p className="mt-1 text-sm font-bold text-slate-900">{t.score}/{t.maxScore}</p>}</div>
            </Link>
          ))}
        </div>
      )}
      {recent.length > 0 && (
        <Card title="Riwayat Ringkas Pengumpulan Terbaru" action={<Link to="/student/grades" className="text-xs font-semibold text-brand-600 hover:underline">Lihat Rekap Nilai Lengkap →</Link>}>
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((t) => (
              <Link key={t.id} to={`/student/tasks/${t.id}`} className="rounded-xl bg-simba-bg p-3 text-sm hover:bg-brand-100">
                <p className="text-[11px] font-bold uppercase text-slate-500">{t.courseName}</p><b className="text-slate-900">{t.title}</b>
                <p className="text-xs text-slate-500">Diserahkan: {fmtDate(t.submission.submittedAt)} • {t.isLate ? 'Terlambat' : 'Tepat Waktu'}</p>
                {t.feedback && <p className="mt-2 rounded-lg bg-white p-2 text-xs italic text-slate-600">&ldquo;{t.feedback}&rdquo;</p>}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

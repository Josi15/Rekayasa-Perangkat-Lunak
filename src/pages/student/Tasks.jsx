import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import SearchBar from '../../components/tables/SearchBar.jsx'
import Chips from '../../components/student/Chips.jsx'
import TaskStatusBadge from '../../components/student/TaskStatusBadge.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentTasks } from '../../services/index.js'
import { fmtDateTime, timeLeft } from '../../utils/date.js'

const FILTERS = [['all', 'Semua'], ['todo', 'Belum Dikerjakan'], ['submitted', 'Dikumpulkan'], ['graded', 'Dinilai'], ['late', 'Terlambat']]
const match = { all: () => true, todo: (t) => t.status === 'todo' || t.status === 'overdue', submitted: (t) => t.status === 'submitted', graded: (t) => t.status === 'graded', late: (t) => t.late }

export default function Tasks() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentTasks.list(user.id), [user.id]))
  return (
    <>
      <PageHeader title="Tugas" description="Seluruh tugas dari kelas yang Anda ikuti." breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Tugas' }]} />
      <AsyncBoundary state={state}>{(tasks) => <TaskList tasks={tasks} />}</AsyncBoundary>
    </>
  )
}

function TaskList({ tasks }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const open = (t) => (t.status === 'todo' || t.status === 'overdue' ? 0 : 1)
    return tasks.filter((t) => match[filter](t) && (!s || [t.title, t.courseName].some((v) => v.toLowerCase().includes(s))))
      .sort((a, b) => open(a) - open(b) || (open(a) === 0 ? new Date(a.due) - new Date(b.due) : new Date(b.due) - new Date(a.due)))
  }, [tasks, filter, q])
  return (
    <>
      <div className="mb-3"><Chips value={filter} onChange={setFilter} options={FILTERS.map(([v, l]) => [v, l, tasks.filter(match[v]).length])} /></div>
      <div className="mb-4"><SearchBar value={q} onChange={setQ} placeholder="Cari tugas atau kelas..." /></div>
      {shown.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white"><EmptyState title="Tugas tidak ditemukan" description="Ubah filter atau kata kunci." /></div> : (
        <div className="space-y-2">
          {shown.map((t) => (
            <Link key={t.id} to={`/student/tasks/${t.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-500">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{t.title}</p>
                <p className="text-sm text-slate-500">{t.courseName}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock className="size-3.5" />Tenggat {fmtDateTime(t.due)}{(t.status === 'todo' || t.status === 'overdue') && ` · ${timeLeft(t.due)}`}</p>
              </div>
              <div className="text-right"><TaskStatusBadge task={t} />{t.status === 'graded' && <p className="mt-1 text-sm font-semibold text-slate-900">{t.score}/{t.maxScore}</p>}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

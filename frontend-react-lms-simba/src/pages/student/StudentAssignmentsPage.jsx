import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import SearchBar from '../../components/forms/SearchBar'
import Chips from '../../components/student/Chips'
import TaskStatusBadge from '../../components/student/TaskStatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { studentService } from '../../services'
import { formatDateTime } from '../../utils/format'
import { taskState, isOpen, timeLeft } from '../../utils/student'

const FILTERS = [['all', 'Semua'], ['todo', 'Belum dikumpulkan'], ['submitted', 'Menunggu penilaian'], ['graded', 'Sudah dinilai'], ['late', 'Terlambat']]
const MATCH = {
  all: () => true,
  todo: (t) => isOpen(t.st),
  submitted: (t) => t.st === 'submitted',
  graded: (t) => t.st === 'graded',
  late: (t) => t.st === 'overdue' || t.a.submission?.late === true,
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentService.listAssignments(user.id), [user.id]))
  return (
    <>
      <PageHeader title="Tugas" description="Seluruh tugas dari kelas yang Anda ikuti." breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Tugas' }]} />
      <AsyncBoundary state={state}>{(list) => <TaskList list={list} />}</AsyncBoundary>
    </>
  )
}

function TaskList({ list }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [now] = useState(() => Date.now())
  const rows = useMemo(() => list.map((a) => ({ a, st: taskState(a, now) })), [list, now])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const rank = (t) => (isOpen(t.st) ? 0 : 1)
    return rows.filter((t) => MATCH[filter](t) && (!s || `${t.a.title} ${t.a.subjectName} ${t.a.className}`.toLowerCase().includes(s)))
      .sort((x, y) => rank(x) - rank(y) || (rank(x) === 0 ? new Date(x.a.dueDate) - new Date(y.a.dueDate) : new Date(y.a.dueDate) - new Date(x.a.dueDate)))
  }, [rows, filter, q])
  if (list.length === 0) return <div className="card"><EmptyState title="Belum ada tugas" /></div>
  return (
    <>
      <div className="mb-3"><Chips label="Filter status tugas" value={filter} onChange={setFilter} options={FILTERS.map(([v, l]) => [v, l, rows.filter(MATCH[v]).length])} /></div>
      <div className="mb-4"><SearchBar value={q} onChange={setQ} placeholder="Cari tugas atau mapel" /></div>
      {shown.length === 0 ? <div className="card"><EmptyState title="Tugas tidak ditemukan" description="Ubah filter atau kata kunci." /></div> : (
        <ul className="space-y-2">
          {shown.map(({ a, st }) => (
            <li key={a.id}>
              <Link to={`/student/assignments/${a.id}`} className="card flex flex-wrap items-center justify-between gap-2 p-4 hover:border-brand-500">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-500">{a.subjectName} · {a.className}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock size={14} />Tenggat {formatDateTime(a.dueDate)}{isOpen(st) && ` · ${timeLeft(a.dueDate, now)}`}</p>
                </div>
                <TaskStatusBadge state={st} late={a.submission?.late} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

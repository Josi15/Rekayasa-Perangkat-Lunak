import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, ClipboardList, User } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import SearchBar from '../../components/forms/SearchBar'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { studentService } from '../../services'

export default function StudentSubjectsPage() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const state = useAsync(useCallback(() => studentService.listSubjects(user.id), [user.id]))
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (state.data ?? []).filter((x) => !s || `${x.name} ${x.teacherName} ${x.className}`.toLowerCase().includes(s))
  }, [state.data, q])
  return (
    <>
      <PageHeader title="Mata Pelajaran" description="Mapel yang Anda ikuti pada kelas aktif." breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Mata Pelajaran' }]} />
      <AsyncBoundary state={state}>
        {(list) => list.length === 0 ? <div className="card"><EmptyState title="Belum ada mata pelajaran" description="Anda belum terdaftar pada kelas aktif." /></div> : (
          <>
            <div className="mb-4"><SearchBar value={q} onChange={setQ} placeholder="Cari mapel atau guru" /></div>
            {shown.length === 0 ? <div className="card"><EmptyState title="Mata pelajaran tidak ditemukan" description="Ubah kata kunci pencarian." /></div> : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((s) => (
                  <li key={`${s.id}-${s.classId}`} className="card flex flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg bg-brand-50 p-2.5 text-brand-600"><BookOpen size={20} /></span>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-slate-900">{s.name}</h2>
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><User size={14} />{s.teacherName}</p>
                        <p className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{s.className}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 text-sm">
                      <Link to={`/student/materials?subject=${s.id}`} className="btn-secondary"><FileText size={16} /> {s.materialCount} materi</Link>
                      <Link to="/student/assignments" className="btn-secondary"><ClipboardList size={16} /> {s.openAssignments} tugas belum dikumpulkan</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </AsyncBoundary>
    </>
  )
}

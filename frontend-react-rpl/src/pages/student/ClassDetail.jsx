import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { User } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import ProgressBar from '../../components/student/ProgressBar.jsx'
import CourseStatus from '../../components/student/CourseStatus.jsx'
import MaterialRow from '../../components/student/MaterialRow.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentService } from '../../services/index.js'

export default function ClassDetail() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentService.getCourse(user.id, Number(courseId)), [user.id, courseId]))
  return (
    <AsyncBoundary state={state}>
      {(c) => (
        <>
          <PageHeader title={c.name} breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Kelas Saya', to: '/student/classes' }, { label: c.name }]} />
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-1"><User className="size-4" />{c.teacher}</span>
              <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{c.category}</span>
              <CourseStatus status={c.status} />
            </div>
            <p className="mt-3 text-slate-700">{c.description}</p>
            <div className="mt-4 max-w-md"><ProgressBar percent={c.percent} label={`${c.done} dari ${c.total} materi dipelajari`} /></div>
          </div>
          <h2 className="mb-3 font-semibold text-slate-900">Daftar materi</h2>
          {c.materials.length === 0 ? <EmptyState title="Belum ada materi" /> : <div className="space-y-2">{c.materials.map((m) => <MaterialRow key={m.id} material={m} />)}</div>}
        </>
      )}
    </AsyncBoundary>
  )
}

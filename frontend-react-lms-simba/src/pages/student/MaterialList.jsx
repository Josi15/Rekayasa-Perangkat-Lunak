import { useCallback, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import SearchBar from '../../components/tables/SearchBar.jsx'
import FilterSelect from '../../components/student/FilterSelect.jsx'
import MaterialRow from '../../components/student/MaterialRow.jsx'
import ProgressBar from '../../components/student/ProgressBar.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentService } from '../../services/index.js'

export default function MaterialList() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentService.listMaterials(user.id), [user.id]))
  return (
    <>
      <PageHeader title="Materi Pembelajaran" description="Semua materi dari kelas yang Anda ikuti." breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Materi' }]} />
      <AsyncBoundary state={state}>{(items) => <Filtered items={items} />}</AsyncBoundary>
    </>
  )
}

function Filtered({ items }) {
  const [q, setQ] = useState('')
  const [course, setCourse] = useState('all')
  const [status, setStatus] = useState('all')
  const courseNames = [...new Set(items.map((i) => i.courseName))]
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter((i) => (course === 'all' || i.courseName === course)
      && (status === 'all' || (status === 'done') === i.done)
      && (!s || [i.title, i.summary].some((v) => v.toLowerCase().includes(s))))
  }, [items, q, course, status])
  const done = items.filter((i) => i.done).length
  return (
    <>
      <div className="mb-4 max-w-md"><ProgressBar percent={Math.round((done / items.length) * 100)} label={`${done} dari ${items.length} materi dipelajari`} /></div>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} placeholder="Cari materi..." />
        <FilterSelect label="Filter kelas" value={course} onChange={setCourse} options={[['all', 'Semua kelas'], ...courseNames.map((c) => [c, c])]} />
        <FilterSelect label="Filter status" value={status} onChange={setStatus} options={[['all', 'Semua status'], ['done', 'Sudah dipelajari'], ['todo', 'Belum dipelajari']]} />
      </div>
      {shown.length === 0
        ? <div className="rounded-xl border border-slate-200 bg-white"><EmptyState title="Materi tidak ditemukan" description="Ubah kata kunci atau filter." /></div>
        : <div className="space-y-2">{shown.map((m) => <MaterialRow key={m.id} material={m} showCourse />)}</div>}
    </>
  )
}

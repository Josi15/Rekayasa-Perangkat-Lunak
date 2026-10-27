import { useCallback, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import SearchBar from '../../components/tables/SearchBar.jsx'
import CourseCard from '../../components/student/CourseCard.jsx'
import FilterSelect from '../../components/student/FilterSelect.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { statusLabels } from '../../components/student/CourseStatus.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentService } from '../../services/index.js'

export default function MyClasses() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentService.listCourses(user.id), [user.id]))
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')

  return (
    <>
      <PageHeader title="Kelas Saya" description="Daftar kelas yang Anda ikuti." breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Kelas Saya' }]} />
      <AsyncBoundary state={state}>
        {(courses) => <List courses={courses} {...{ q, setQ, category, setCategory, status, setStatus }} />}
      </AsyncBoundary>
    </>
  )
}

function List({ courses, q, setQ, category, setCategory, status, setStatus }) {
  const categories = [...new Set(courses.map((c) => c.category))]
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return courses.filter((c) => (category === 'all' || c.category === category) && (status === 'all' || c.status === status)
      && (!s || [c.name, c.teacher, c.description].some((v) => v.toLowerCase().includes(s))))
  }, [courses, q, category, status])
  const reset = () => { setQ(''); setCategory('all'); setStatus('all') }
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} placeholder="Cari kelas, guru..." />
        <FilterSelect label="Filter kategori" value={category} onChange={setCategory} options={[['all', 'Semua kategori'], ...categories.map((c) => [c, c])]} />
        <FilterSelect label="Filter status" value={status} onChange={setStatus} options={[['all', 'Semua status'], ...Object.entries(statusLabels)]} />
      </div>
      {shown.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white"><EmptyState title="Kelas tidak ditemukan" description="Ubah kata kunci atau filter." /><div className="pb-6 text-center"><button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Reset filter</button></div></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      )}
    </>
  )
}

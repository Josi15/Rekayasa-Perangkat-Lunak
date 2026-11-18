import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileText, Paperclip } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/forms/SearchBar'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import FilterSelect from '../../components/student/FilterSelect'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { materialService } from '../../services'
import { formatDate } from '../../utils/format'

export default function StudentMaterialsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const state = useAsync(useCallback(() => materialService.forStudent(user.id), [user.id]))
  const subject = params.get('subject') ?? ''

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (state.data ?? []).filter((m) => (!subject || String(m.subjectId) === subject) && (!s || `${m.title} ${m.description}`.toLowerCase().includes(s)))
  }, [state.data, q, subject])
  const subjects = useMemo(() => [...new Map((state.data ?? []).map((m) => [m.subjectId, m.subjectName])).entries()], [state.data])

  return (
    <>
      <PageHeader title="Materi Pembelajaran" description="Materi yang dipublikasikan guru untuk kelas Anda." breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Materi' }]} />
      <AsyncBoundary state={state}>
        {() => (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <SearchBar value={q} onChange={setQ} placeholder="Cari materi" />
              <FilterSelect label="Filter mata pelajaran" value={subject} onChange={(v) => setParams(v ? { subject: v } : {})} options={[['', 'Semua mata pelajaran'], ...subjects.map(([id, name]) => [String(id), name])]} />
            </div>
            {shown.length === 0 ? <div className="card"><EmptyState title="Materi tidak ditemukan" description="Ubah kata kunci atau filter." /></div> : (
              <ul className="space-y-2">
                {shown.map((m) => (
                  <li key={m.id}>
                    <Link to={`/student/materials/${m.id}`} className="card flex gap-3 p-4 hover:border-brand-500">
                      <span className="h-fit rounded-lg bg-brand-50 p-2.5 text-brand-600"><FileText size={20} /></span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{m.title}</p>
                        <p className="line-clamp-2 text-sm text-slate-500">{m.description}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-400"><span>{m.subjectName}</span><span>Diperbarui {formatDate(m.updatedAt)}</span>{m.attachments.length > 0 && <span className="flex items-center gap-1"><Paperclip size={12} />{m.attachments.length} lampiran</span>}</p>
                      </div>
                    </Link>
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

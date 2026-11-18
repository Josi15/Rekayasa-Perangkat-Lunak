import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import SearchBar from '../../components/forms/SearchBar'
import Chips from '../../components/student/Chips'
import { useAsync } from '../../hooks/useAsync'
import { announcementService } from '../../services'
import { formatDate } from '../../utils/format'

export default function StudentAnnouncementsPage() {
  const state = useAsync(useCallback(() => announcementService.forRole('student'), []))
  return (
    <>
      <PageHeader title="Pengumuman" description="Informasi terbaru dari sekolah." breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Pengumuman' }]} />
      <AsyncBoundary state={state}>{(list) => <List list={list} />}</AsyncBoundary>
    </>
  )
}

function List({ list }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const cats = useMemo(() => [...new Set(list.map((a) => a.category))], [list])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return list.filter((a) => (cat === 'all' || a.category === cat) && (!s || `${a.title} ${a.body}`.toLowerCase().includes(s)))
  }, [list, q, cat])
  if (list.length === 0) return <div className="card"><EmptyState title="Belum ada pengumuman" /></div>
  return (
    <>
      {cats.length > 1 && <div className="mb-3"><Chips label="Filter kategori" value={cat} onChange={setCat} options={[['all', 'Semua', list.length], ...cats.map((c) => [c, c, list.filter((a) => a.category === c).length])]} /></div>}
      <div className="mb-4"><SearchBar value={q} onChange={setQ} placeholder="Cari pengumuman" /></div>
      {shown.length === 0 ? <div className="card"><EmptyState title="Pengumuman tidak ditemukan" description="Ubah filter atau kata kunci." /></div> : (
        <ul className="space-y-2">
          {shown.map((a) => (
            <li key={a.id}>
              <Link to={`/student/announcements/${a.id}`} className="card block p-4 hover:border-brand-500">
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="line-clamp-2 text-sm text-slate-500">{a.body.replace(/\n+/g, ' ')}</p>
                <p className="mt-1 text-xs text-slate-400">{a.category} · {a.author} · {formatDate(a.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

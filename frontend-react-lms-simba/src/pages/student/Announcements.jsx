import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import SearchBar from '../../components/tables/SearchBar.jsx'
import Chips from '../../components/student/Chips.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentNotices } from '../../services/index.js'
import { fmtDate } from '../../utils/date.js'

export default function Announcements() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentNotices.listAnnouncements(user.id), [user.id]))
  return (
    <>
      <PageHeader title="Pengumuman" breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Pengumuman' }]} />
      <AsyncBoundary state={state}>{(items) => <List items={items} />}</AsyncBoundary>
    </>
  )
}

function List({ items }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter((a) => (filter === 'all' || !a.read) && (!s || [a.title, a.body, a.category].some((v) => v.toLowerCase().includes(s))))
  }, [items, filter, q])
  return (
    <>
      <div className="mb-3"><Chips value={filter} onChange={setFilter} options={[['all', 'Semua', items.length], ['unread', 'Belum dibaca', items.filter((a) => !a.read).length]]} /></div>
      <div className="mb-4"><SearchBar value={q} onChange={setQ} placeholder="Cari pengumuman..." /></div>
      {shown.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white"><EmptyState title="Pengumuman tidak ditemukan" /></div> : (
        <div className="space-y-2">
          {shown.map((a) => (
            <Link key={a.id} to={`/student/announcements/${a.id}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-500">
              <span className={`mt-2 size-2 shrink-0 rounded-full ${a.read ? 'bg-transparent' : 'bg-brand-600'}`} aria-label={a.read ? 'Sudah dibaca' : 'Belum dibaca'} />
              <div className="min-w-0"><p className={`text-slate-900 ${a.read ? '' : 'font-semibold'}`}>{a.title}</p><p className="truncate text-sm text-slate-500">{a.body.replace(/\n+/g, ' ')}</p>
                <p className="mt-1 text-xs text-slate-400">{a.category} · {a.author} · {fmtDate(a.at)}</p></div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

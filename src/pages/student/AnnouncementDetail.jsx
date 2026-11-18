import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentNotices } from '../../services/index.js'
import { fmtDateTime } from '../../utils/date.js'

export default function AnnouncementDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentNotices.getAnnouncement(user.id, Number(id)), [user.id, id]))
  return (
    <AsyncBoundary state={state}>
      {(a) => (
        <>
          <PageHeader title={a.title} breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Pengumuman', to: '/student/announcements' }, { label: a.title }]} />
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500"><span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{a.category}</span> · {a.author} · {fmtDateTime(a.at)}</p>
            <div className="mt-4 space-y-3 text-slate-700">{a.body.split('\n\n').map((p) => <p key={p} className="leading-relaxed">{p}</p>)}</div>
          </article>
          <Link to="/student/announcements" className="mt-4 inline-block text-sm text-brand-600 hover:underline">Kembali ke daftar pengumuman</Link>
        </>
      )}
    </AsyncBoundary>
  )
}

import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/common/ErrorState'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import { useAsync } from '../../hooks/useAsync'
import { announcementService } from '../../services'
import { formatDate } from '../../utils/format'

export default function StudentAnnouncementDetailPage() {
  const { id } = useParams()
  // Lewat daftar untuk peran siswa: hanya pengumuman yang memang boleh dibaca siswa yang bisa dibuka.
  const state = useAsync(useCallback(async () => (await announcementService.forRole('student')).find((a) => String(a.id) === String(id)) ?? null, [id]))
  return (
    <AsyncBoundary state={state}>
      {(a) => !a ? <ErrorState message="Pengumuman tidak tersedia untuk Anda." /> : (
        <>
          <PageHeader title={a.title} breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Pengumuman', to: '/student/announcements' }, { label: a.title }]} />
          <article className="card p-5">
            <p className="text-sm text-slate-500"><span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{a.category}</span> · {a.author} · {formatDate(a.createdAt)}</p>
            <div className="mt-4 space-y-3 text-slate-700">{String(a.body).split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line leading-relaxed">{p}</p>)}</div>
          </article>
          <Link to="/student/announcements" className="mt-4 inline-block text-sm text-brand-600 hover:underline">Kembali ke daftar pengumuman</Link>
        </>
      )}
    </AsyncBoundary>
  )
}

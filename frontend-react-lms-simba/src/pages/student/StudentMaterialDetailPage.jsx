import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/common/ErrorState'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import DownloadButton from '../../components/common/DownloadButton'
import { formatSize } from '../../components/forms/AttachmentPicker'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { materialService, serviceMode } from '../../services'
import { formatDate } from '../../utils/format'

function Nav({ m, dir }) {
  if (!m) return <div className="flex-1" />
  return (
    <Link to={`/student/materials/${m.id}`} className={`card flex flex-1 items-center gap-2 p-3 text-sm hover:border-brand-500 ${dir === 'next' ? 'justify-end text-right' : ''}`}>
      {dir === 'prev' && <ChevronLeft size={16} />}
      <span className="min-w-0"><span className="block text-xs text-slate-500">{dir === 'prev' ? 'Sebelumnya' : 'Selanjutnya'}</span><span className="block truncate">{m.title}</span></span>
      {dir === 'next' && <ChevronRight size={16} />}
    </Link>
  )
}

export default function StudentMaterialDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  // Daftar materi hanya untuk tombol sebelumnya/selanjutnya: gagal memuatnya tidak boleh menutup materi itu sendiri.
  const load = useCallback(async () => {
    const [m, all] = await Promise.all([materialService.getForStudent(user.id, id), materialService.forStudent(user.id).catch(() => [])])
    if (!m) return null
    const same = all.filter((x) => x.subjectId === m.subjectId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const i = same.findIndex((x) => String(x.id) === String(m.id))
    return { m, prev: i > 0 ? same[i - 1] : null, next: i >= 0 && i < same.length - 1 ? same[i + 1] : null }
  }, [user.id, id])
  const state = useAsync(load)
  return (
    <AsyncBoundary state={state}>
      {(d) => !d ? <ErrorState message="Materi tidak tersedia untuk Anda." /> : (
        <>
          <PageHeader title={d.m.title} description={`${d.m.subjectName} · diperbarui ${formatDate(d.m.updatedAt)}`} breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Materi', to: '/student/materials' }, { label: d.m.title }]} />
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="card p-5 lg:col-span-2">
              {d.m.description && <p className="mb-3 text-slate-600">{d.m.description}</p>}
              {d.m.content ? <div className="whitespace-pre-line leading-relaxed text-slate-800">{d.m.content}</div> : <p className="text-sm text-slate-500">Materi ini berupa berkas lampiran.</p>}
            </article>
            <aside className="card h-fit p-5">
              <h2 className="mb-3 font-semibold text-slate-900">Lampiran</h2>
              {d.m.attachments.length === 0 ? <p className="text-sm text-slate-500">Tidak ada lampiran.</p> : (
                <ul className="space-y-2 text-sm">
                  {d.m.attachments.map((a) => <li key={a.name} className="flex items-center gap-2 text-slate-700"><FileText size={16} className="shrink-0 text-brand-600" /><span className="min-w-0 flex-1 truncate">{a.name}</span><span className="text-xs text-slate-500">{formatSize(a.size)}</span><DownloadButton attachment={a} /></li>)}
                </ul>
              )}
              {serviceMode.mock && d.m.attachments.length > 0 && <p className="mt-3 text-xs text-slate-500">Simulasi: berkas belum bisa diunduh sampai backend terhubung.</p>}
            </aside>
          </div>
          <div className="mt-6 flex gap-3"><Nav m={d.prev} dir="prev" /><Nav m={d.next} dir="next" /></div>
        </>
      )}
    </AsyncBoundary>
  )
}

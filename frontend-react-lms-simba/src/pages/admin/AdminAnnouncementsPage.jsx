import { useCallback, useState } from 'react'
import { Plus, Megaphone, CircleCheck, FilePen, CalendarClock } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/common/EmptyState'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import FormModal from '../../components/forms/FormModal'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { announcementService, serviceMode } from '../../services'
import { formatDate } from '../../utils/format'

const audiences = [{ value: 'all', label: 'Semua' }, { value: 'student', label: 'Siswa' }, { value: 'teacher', label: 'Guru' }]
const audienceLabel = Object.fromEntries(audiences.map((a) => [a.value, a.label]))
const fields = [
  { name: 'title', label: 'Judul', required: true },
  ...(serviceMode.mock ? [
    { name: 'category', label: 'Kategori', hint: 'Mis. Akademik, Kegiatan, Umum.' },
    { name: 'audience', label: 'Sasaran', type: 'select', options: audiences, required: true },
  ] : []), // backend: pengumuman admin selalu global untuk semua peran
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Dipublikasikan' }], required: true },
  { name: 'body', label: 'Isi pengumuman', type: 'textarea', required: true },
]

export default function AdminAnnouncementsPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const state = useAsync(useCallback(() => announcementService.list(), []))
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)

  const save = async (v) => {
    if (form === 'new') await announcementService.create(v, user.name); else await announcementService.update(form.id, v)
    notify(form === 'new' ? 'Pengumuman dibuat (simulasi).' : 'Pengumuman diperbarui (simulasi).', 'success')
    setForm(null); state.reload()
  }
  const remove = async () => {
    try { await announcementService.remove(del.id); notify('Pengumuman dihapus.', 'success'); state.reload() } catch (e) { notify(e.message, 'error') }
    setDel(null)
  }

  return (
    <>
      <AdminHead group="Komunikasi" title="Pengumuman" description="Kelola pemberitahuan dan siaran sekolah untuk siswa dan guru."
        actions={<button className="btn-primary" onClick={() => setForm('new')}><Plus size={16} /> Buat pengumuman</button>} />
      <AsyncBoundary state={state}>
        {(list) => {
          const published = list.filter((a) => a.status === 'published')
          const latest = list.map((a) => a.createdAt).filter(Boolean).sort().at(-1)
          return (
            <>
              <StatGrid cols={3}>
                <AdminStat label="Total pengumuman" value={list.length} unit="Berita" icon={Megaphone} foot="Seluruh siaran sekolah" />
                <AdminStat label="Dipublikasikan" value={published.length} unit="Berita" icon={CircleCheck} foot={serviceMode.mock ? `${list.length - published.length} masih draft` : 'Langsung terbit untuk semua peran'} />
                <AdminStat label="Terbit terakhir" value={latest ? formatDate(latest) : '-'} icon={CalendarClock} tone="gray" />
              </StatGrid>
              <section className="panel">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><FilePen size={16} className="text-brand-600" /> Pemberitahuan & Siaran Sekolah</h2>
                {list.length === 0 ? <EmptyState title="Belum ada pengumuman" /> : (
                  <ul className="space-y-3">
                    {list.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-brand-50 p-5">
                        <div className="min-w-0 flex-1">
                          <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500"><Pill>{a.category}</Pill><span>sasaran {audienceLabel[a.audience]} · {a.author} · {formatDate(a.createdAt)}</span></p>
                          <p className="text-base font-bold text-slate-900">{a.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <StatusBadge status={a.status} />
                          <button className="text-brand-600 hover:underline" onClick={() => setForm(a)} aria-label={`Ubah ${a.title}`}>Ubah</button>
                          <button className="text-red-600 hover:underline" onClick={() => setDel(a)} aria-label={`Hapus ${a.title}`}>Hapus</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )
        }}
      </AsyncBoundary>
      {form && <FormModal key={form === 'new' ? 'new' : form.id} open title={form === 'new' ? 'Buat pengumuman' : 'Ubah pengumuman'} fields={fields} initial={form === 'new' ? { audience: 'all', status: 'published' } : form} onSubmit={save} onClose={() => setForm(null)} />}
      <ConfirmationDialog open={!!del} title="Hapus pengumuman?" message={del && `"${del.title}" akan dihapus.`} confirmLabel="Hapus" onCancel={() => setDel(null)} onConfirm={remove} />
    </>
  )
}

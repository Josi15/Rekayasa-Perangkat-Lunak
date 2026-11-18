import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, Send, Archive } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/forms/SearchBar'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { teacherAssignmentService as svc } from '../../services'
import { formatDateTime } from '../../utils/format'

export default function AssignmentManagePage() {
  const { data, loading, error, reload } = useAsync(svc.list)
  const { notify } = useToast()
  const [q, setQ] = useState('')
  const [cls, setCls] = useState('all')
  const [status, setStatus] = useState('all')
  const [toDelete, setToDelete] = useState(null)
  const classNames = useMemo(() => [...new Set((data ?? []).map((a) => a.className))], [data])
  const rows = useMemo(() => (data ?? []).filter((a) => (cls === 'all' || a.className === cls) && (status === 'all' || a.status === status) && a.title.toLowerCase().includes(q.toLowerCase())), [data, q, cls, status])

  const act = async (fn, msg) => { try { await fn(); notify(msg, 'success'); reload() } catch (e) { notify(e.message, 'error') } }
  return (
    <>
      <PageHeader title="Kelola Tugas" breadcrumbs={[{ label: 'Beranda', to: '/teacher/dashboard' }, { label: 'Bank Tugas', to: '/teacher/assignments' }, { label: 'Kelola' }]}
        actions={<Link to="/teacher/assignments/new" className="btn-primary"><Plus size={16} /> Buat tugas</Link>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="Cari tugas" />
        <select className="input w-auto" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Filter kelas"><option value="all">Semua kelas</option>{classNames.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status"><option value="all">Semua status</option><option value="draft">Draft</option><option value="published">Dipublikasikan</option><option value="archived">Diarsipkan</option></select>
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? <div className="card"><EmptyState title="Tidak ada tugas" description="Buat tugas baru atau ubah filter." /></div> : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><p className="font-medium">{a.title}</p><p className="text-sm text-slate-500">{a.className} · tenggat {formatDateTime(a.dueDate)} · {a.submitted}/{a.total} terkumpul</p></div>
              <StatusBadge status={a.status} />
              <div className="flex gap-1">
                {a.status === 'draft' && <button className="btn-secondary px-2" aria-label="Publikasikan" onClick={() => act(() => svc.setStatus(a.id, 'published'), 'Tugas dipublikasikan (simulasi).')}><Send size={14} /></button>}
                {a.status === 'published' && <button className="btn-secondary px-2" aria-label="Arsipkan" onClick={() => act(() => svc.setStatus(a.id, 'archived'), 'Tugas diarsipkan.')}><Archive size={14} /></button>}
                <Link className="btn-secondary px-2" to={`/teacher/assignments/${a.id}`} aria-label="Detail"><Eye size={14} /></Link>
                <Link className="btn-secondary px-2" to={`/teacher/assignments/${a.id}/edit`} aria-label="Edit"><Pencil size={14} /></Link>
                <button className="btn-secondary px-2 text-red-600" aria-label="Hapus" onClick={() => setToDelete(a)}><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmationDialog open={!!toDelete} title="Hapus tugas?" message={`Tugas "${toDelete?.title}" dan semua pengumpulannya akan dihapus.`} confirmLabel="Hapus"
        onCancel={() => setToDelete(null)} onConfirm={() => { act(() => svc.remove(toDelete.id), 'Tugas dihapus (simulasi).'); setToDelete(null) }} />
    </>
  )
}

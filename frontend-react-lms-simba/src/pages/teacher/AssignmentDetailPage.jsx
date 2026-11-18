import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import DataTable from '../../components/tables/DataTable'
import GradeDialog from './GradeDialog'
import { useAsync } from '../../hooks/useAsync'
import { teacherAssignmentService as svc, serviceMode } from '../../services'
import DownloadButton from '../../components/common/DownloadButton'
import { formatDateTime } from '../../utils/format'

const keys = ['name']
const filters = { all: () => true, missing: (r) => r.state === 'missing', submitted: (r) => !!r.submission, late: (r) => r.submission?.late, ungraded: (r) => r.state === 'submitted', graded: (r) => r.state === 'graded' }

export default function AssignmentDetailPage() {
  const { id } = useParams()
  const load = useCallback(() => svc.roster(id), [id])
  const { data, loading, error, reload } = useAsync(load)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const rows = useMemo(() => (data?.rows ?? []).filter(filters[filter]), [data, filter])
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <ErrorState message="Tugas tidak ditemukan." />
  const a = data.assignment
  const columns = [
    { key: 'name', header: 'Siswa' },
    { key: 'state', header: 'Status', render: (r) => <span className="flex gap-1"><StatusBadge status={r.state} />{r.submission?.late && <StatusBadge status="late" />}</span> },
    { key: 'time', header: 'Waktu kumpul', render: (r) => (r.submission ? formatDateTime(r.submission.submittedAt) : '-') },
    { key: 'score', header: 'Nilai', render: (r) => r.submission?.score ?? '-' },
    { key: 'act', header: '', render: (r) => r.submission && <button className="text-brand-600 hover:underline" onClick={() => setSelected(r)}>{r.state === 'graded' ? 'Edit nilai' : 'Nilai'}</button> },
  ]
  return (
    <>
      <PageHeader title={a.title} description={`${a.className} · tenggat ${formatDateTime(a.dueDate)}`} breadcrumbs={[{ label: 'Beranda', to: '/teacher/dashboard' }, { label: 'Tugas', to: '/teacher/assignments' }, { label: a.title }]}
        actions={<div className="flex items-center gap-2"><StatusBadge status={a.status} /><Link to={`/teacher/assignments/${a.id}/edit`} className="btn-secondary"><Pencil size={16} /> Edit</Link></div>} />
      <div className="card mb-6 max-w-3xl p-5 text-sm"><h2 className="mb-1 font-semibold">Instruksi (pratinjau)</h2><p className="whitespace-pre-wrap">{a.instructions}</p>
        {a.attachments.length > 0 && <p className="mt-2 flex flex-wrap items-center gap-2 text-slate-500">Lampiran: {a.attachments.map((x) => x.name).join(', ')}{serviceMode.mock ? ' (simulasi)' : ''}{a.attachments.map((x) => <DownloadButton key={x.name} attachment={x} />)}</p>}</div>
      <div className="mb-3 flex items-center gap-3"><h2 className="font-semibold">Pengumpulan siswa</h2>
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter pengumpulan">
          <option value="all">Semua</option><option value="missing">Belum mengumpulkan</option><option value="submitted">Sudah mengumpulkan</option><option value="late">Terlambat</option><option value="ungraded">Belum dinilai</option><option value="graded">Sudah dinilai</option>
        </select></div>
      <DataTable columns={columns} rows={rows} searchKeys={keys} searchPlaceholder="Cari siswa" />
      {selected && <GradeDialog row={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); reload() }} />}
    </>
  )
}

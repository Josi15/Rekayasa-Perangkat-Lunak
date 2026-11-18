import { useCallback, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatisticCard from '../../components/common/StatisticCard'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import DataTable from '../../components/tables/DataTable'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { teacherAssignmentService as svc } from '../../services'
import { toCsv, downloadCsv } from '../../utils/csv'

const csvCols = [{ key: 'studentName', header: 'Siswa' }, { key: 'className', header: 'Kelas' }, { key: 'assignmentTitle', header: 'Tugas' }, { key: 'score', header: 'Nilai' }]
const keys = ['studentName']

export default function GradeRecapPage() {
  const load = useCallback(() => svc.recap(), [])
  const { data, loading, error, reload } = useAsync(load)
  const { notify } = useToast()
  const [cls, setCls] = useState('all')
  const [asg, setAsg] = useState('all')
  const classes = useMemo(() => [...new Map((data ?? []).map((r) => [r.classId, r.className]))], [data])
  const assignments = useMemo(() => [...new Map((data ?? []).filter((r) => cls === 'all' || r.classId === Number(cls)).map((r) => [r.assignmentId, r.assignmentTitle]))], [data, cls])
  const rows = useMemo(() => (data ?? []).filter((r) => (cls === 'all' || r.classId === Number(cls)) && (asg === 'all' || r.assignmentId === Number(asg))), [data, cls, asg])
  const scores = rows.filter((r) => r.status === 'graded').map((r) => r.score)

  const columns = [
    { key: 'studentName', header: 'Siswa' }, { key: 'className', header: 'Kelas' }, { key: 'assignmentTitle', header: 'Tugas' },
    { key: 'score', header: 'Nilai', render: (r) => r.score ?? '-' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'graded' ? 'graded' : 'submitted'} /> },
  ]
  const exportCsv = () => { downloadCsv('rekap-nilai.csv', toCsv(csvCols, rows.filter((r) => r.status === 'graded'))); notify('CSV diunduh dari data simulasi.', 'success') }
  return (
    <>
      <PageHeader title="Rekap Nilai" description="Nilai per tugas. Nilai akhir tidak dihitung karena rumus/bobot belum ditentukan." breadcrumbs={[{ label: 'Beranda', to: '/teacher/dashboard' }, { label: 'Rekap Nilai' }]}
        actions={<button className="btn-secondary" disabled={scores.length === 0} onClick={exportCsv}><Download size={16} /> Ekspor CSV</button>} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <select className="input w-auto" value={cls} onChange={(e) => { setCls(e.target.value); setAsg('all') }} aria-label="Filter kelas"><option value="all">Semua kelas</option>{classes.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
            <select className="input w-auto" value={asg} onChange={(e) => setAsg(e.target.value)} aria-label="Filter tugas"><option value="all">Semua tugas</option>{assignments.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
          </div>
          <div className="mb-4 grid gap-4 sm:grid-cols-4">
            <StatisticCard label="Sudah dinilai" value={scores.length} />
            <StatisticCard label="Rata-rata" value={scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '-'} />
            <StatisticCard label="Tertinggi" value={scores.length ? Math.max(...scores) : '-'} />
            <StatisticCard label="Terendah" value={scores.length ? Math.min(...scores) : '-'} />
          </div>
          {rows.length === 0 ? <div className="card"><EmptyState title="Belum ada data nilai" /></div> : <DataTable columns={columns} rows={rows} searchKeys={keys} searchPlaceholder="Cari siswa" />}
        </>
      )}
    </>
  )
}

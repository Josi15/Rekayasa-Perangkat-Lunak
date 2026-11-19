import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import DataTable from '../../components/tables/DataTable.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { classScheduleService } from '../../services/index.js'

export default function AdminClasses() {
  const navigate = useNavigate()
  const state = useAsync(classScheduleService.listClasses)
  const columns = [
    { key: 'name', label: 'Kelas' },
    { key: 'homeroom', label: 'Wali kelas' },
    { key: 'students', label: 'Siswa' },
    { key: 'scheduleCount', label: 'Jumlah jadwal' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', label: 'Aksi', render: (r) => <button onClick={() => navigate(`/admin/schedules?class=${r.id}`)} className="text-brand-600 hover:underline">Atur jadwal</button> },
  ]
  return (
    <>
      <PageHeader title="Kelas" description="Daftar kelas dan kelengkapan jadwalnya." breadcrumb={[{ label: 'Beranda', to: '/admin' }, { label: 'Kelas' }]} />
      <AsyncBoundary state={state}>{(rows) => <DataTable columns={columns} rows={rows} searchPlaceholder="Cari kelas..." />}</AsyncBoundary>
    </>
  )
}

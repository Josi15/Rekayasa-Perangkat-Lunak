import { useState } from 'react'
import { School, ClipboardList, Megaphone, Users } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatisticCard from '../../components/common/StatisticCard.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import { Modal, ConfirmationDialog } from '../../components/common/Modal.jsx'
import { LoadingState, ErrorState } from '../../components/common/States.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import DataTable from '../../components/tables/DataTable.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { classService, assignmentService, announcementService } from '../../services/index.js'
import { roleLabels } from '../../utils/menus.js'

const load = () => Promise.all([classService.list(), assignmentService.list(), announcementService.list()])

export default function RoleDashboard({ role }) {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(load)
  const [detail, setDetail] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  const [classes, assignments, announcements] = data

  const remove = async () => {
    await classService.remove(toDelete.id)
    toast(`Kelas ${toDelete.name} dihapus (simulasi).`)
    setToDelete(null)
    reload()
  }

  const columns = [
    { key: 'name', label: 'Kelas' },
    { key: 'homeroom', label: 'Wali kelas' },
    { key: 'students', label: 'Siswa' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', label: 'Aksi', render: (r) => (
      <span className="flex gap-3 text-sm">
        <button onClick={() => setDetail(r)} className="text-brand-600 hover:underline">Detail</button>
        {role === 'admin' && <button onClick={() => setToDelete(r)} className="text-red-600 hover:underline">Hapus</button>}
      </span>
    ) },
  ]

  return (
    <>
      <PageHeader title={`Dashboard ${roleLabels[role]}`} description={`Selamat datang, ${user.name}.`} breadcrumb={[{ label: 'Beranda' }, { label: 'Dashboard' }]} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Kelas" value={classes.length} icon={School} />
        <StatisticCard label="Total siswa" value={classes.reduce((a, c) => a + c.students, 0)} icon={Users} />
        <StatisticCard label="Tugas aktif" value={assignments.filter((a) => a.status === 'open').length} icon={ClipboardList} />
        <StatisticCard label="Pengumuman" value={announcements.length} icon={Megaphone} />
      </div>
      <DataTable columns={columns} rows={classes} searchPlaceholder="Cari kelas..." />
      <Modal open={!!detail} title={detail ? `Kelas ${detail.name}` : ''} onClose={() => setDetail(null)}>
        {detail && <p className="text-sm text-slate-600">Wali kelas: {detail.homeroom}. Jumlah siswa: {detail.students}.</p>}
      </Modal>
      <ConfirmationDialog open={!!toDelete} title="Hapus kelas?" message={`Kelas ${toDelete?.name} akan dihapus dari data simulasi.`} confirmLabel="Hapus" onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  )
}

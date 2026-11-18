import { useCallback, useState } from 'react'
import { Plus, School, CircleCheck, Archive, GraduationCap } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import StatusBadge from '../../components/common/StatusBadge'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import DataTable from '../../components/tables/DataTable'
import FormModal from '../../components/forms/FormModal'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { classService, userService, serviceMode } from '../../services'

const searchKeys = ['name', 'homeroom']

export default function AdminClassesPage() {
  const { notify } = useToast()
  const state = useAsync(useCallback(() => Promise.all([classService.list(), userService.list()]), []))
  const [form, setForm] = useState(null)

  const save = async (v) => {
    if (form === 'new') await classService.create(v); else await classService.update(form.id, v)
    notify(form === 'new' ? 'Kelas ditambahkan (simulasi).' : 'Kelas diperbarui (simulasi).', 'success')
    setForm(null); state.reload()
  }
  const archive = async (c) => {
    try { await classService.setStatus(c.id, c.status === 'archived' ? 'active' : 'archived'); notify(c.status === 'archived' ? 'Kelas dipulihkan.' : 'Kelas diarsipkan.', 'success'); state.reload() }
    catch (e) { notify(e.message, 'error') }
  }

  return (
    <>
      <AdminHead group="Master Data" title="Kelas & Rombel" description="Rombongan belajar, wali kelas, dan mata pelajaran yang diajarkan."
        actions={<button className="btn-primary" onClick={() => setForm('new')}><Plus size={16} /> Tambah kelas</button>} />
      <AsyncBoundary state={state}>
        {([classes, users]) => {
          const teachers = users.filter((u) => u.role === 'teacher').map((u) => ({ value: u.id, label: u.name }))
          const fields = [
            { name: 'name', label: 'Nama kelas', required: true },
            { name: 'homeroomId', label: 'Wali kelas', type: 'select', options: teachers, required: true },
            ...(serviceMode.mock ? [{ name: 'size', label: 'Jumlah siswa', type: 'number', required: true }] : []), // backend menghitung jumlah siswa dari keanggotaan kelas
          ]
          const columns = [
            { key: 'name', header: 'Kelas', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
            { key: 'homeroom', header: 'Wali kelas' }, { key: 'size', header: 'Jumlah siswa' },
            { key: 'subjects', header: 'Mapel', render: (r) => (r.subjects.length ? <span className="flex flex-wrap gap-1">{r.subjects.map((s) => <Pill key={s}>{s}</Pill>)}</span> : '-') },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'act', header: '', render: (r) => (
              <span className="flex gap-3 whitespace-nowrap">
                <button className="text-brand-600 hover:underline" onClick={() => setForm(r)} aria-label={`Ubah ${r.name}`}>Ubah</button>
                <button className="text-slate-600 hover:underline" onClick={() => archive(r)} aria-label={`${r.status === 'archived' ? 'Pulihkan' : 'Arsipkan'} ${r.name}`}>{r.status === 'archived' ? 'Pulihkan' : 'Arsipkan'}</button>
              </span>
            ) },
          ]
          const active = classes.filter((c) => c.status === 'active')
          return (
            <>
              <StatGrid>
                <AdminStat label="Total rombel" value={classes.length} unit="Kelas" icon={School} foot="Terdaftar di sistem" />
                <AdminStat label="Rombel aktif" value={active.length} unit="Kelas" icon={CircleCheck} foot="Dipakai pada tahun ajaran berjalan" />
                <AdminStat label="Diarsipkan" value={classes.length - active.length} unit="Kelas" icon={Archive} tone="gray" foot="Tidak muncul di pilihan jadwal" />
                <AdminStat label="Siswa terdaftar" value={active.reduce((s, c) => s + (c.size ?? 0), 0)} unit="Siswa" icon={GraduationCap} foot="Jumlah pada rombel aktif" />
              </StatGrid>
              <DataTable variant="admin" columns={columns} rows={classes} pageSize={8} searchKeys={searchKeys} searchPlaceholder="Cari kelas atau wali" />
              {form && <FormModal key={form === 'new' ? 'new' : form.id} open title={form === 'new' ? 'Tambah kelas' : 'Ubah kelas'} fields={fields} initial={form === 'new' ? { size: 30 } : form} onSubmit={save} onClose={() => setForm(null)} />}
            </>
          )
        }}
      </AsyncBoundary>
    </>
  )
}

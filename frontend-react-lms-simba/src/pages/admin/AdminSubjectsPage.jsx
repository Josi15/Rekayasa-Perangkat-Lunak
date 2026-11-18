import { useCallback, useState } from 'react'
import { Plus, BookOpen, CircleCheck, Archive, UserRound } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import StatusBadge from '../../components/common/StatusBadge'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import DataTable from '../../components/tables/DataTable'
import FormModal from '../../components/forms/FormModal'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { subjectService, userService, serviceMode } from '../../services'

const searchKeys = ['name', 'code', 'teacherName']

export default function AdminSubjectsPage() {
  const { notify } = useToast()
  const state = useAsync(useCallback(() => Promise.all([subjectService.list(), userService.list()]), []))
  const [form, setForm] = useState(null)

  const save = async (v) => {
    if (form === 'new') await subjectService.create(v); else await subjectService.update(form.id, v)
    notify(form === 'new' ? 'Mapel ditambahkan (simulasi).' : 'Mapel diperbarui (simulasi).', 'success')
    setForm(null); state.reload()
  }
  const archive = async (s) => {
    try { await subjectService.setStatus(s.id, s.status === 'archived' ? 'active' : 'archived'); notify(s.status === 'archived' ? 'Mapel dipulihkan.' : 'Mapel diarsipkan.', 'success'); state.reload() }
    catch (e) { notify(e.message, 'error') }
  }

  return (
    <>
      <AdminHead group="Master Data" title="Mata Pelajaran & Kurikulum" description="Daftar mata pelajaran dan guru pengampu."
        actions={<button className="btn-primary" onClick={() => setForm('new')}><Plus size={16} /> Tambah mapel</button>} />
      <AsyncBoundary state={state}>
        {([subjects, users]) => {
          const teachers = users.filter((u) => u.role === 'teacher').map((u) => ({ value: u.id, label: u.name }))
          const fields = [
            { name: 'name', label: 'Nama mapel', required: true },
            ...(serviceMode.mock ? [{ name: 'code', label: 'Kode', required: true, hint: '2–6 huruf/angka, mis. MTK.' }] : []), // backend tidak punya kode mapel
            { name: 'teacherId', label: 'Guru pengampu', type: 'select', options: teachers, required: true },
          ]
          const columns = [
            { key: 'code', header: 'Kode', render: (r) => <Pill>{r.code}</Pill> },
            { key: 'name', header: 'Mapel', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
            { key: 'teacherName', header: 'Guru pengampu' }, { key: 'classCount', header: 'Jumlah kelas' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'act', header: '', render: (r) => (
              <span className="flex gap-3 whitespace-nowrap">
                <button className="text-brand-600 hover:underline" onClick={() => setForm(r)} aria-label={`Ubah ${r.name}`}>Ubah</button>
                <button className="text-slate-600 hover:underline" onClick={() => archive(r)} aria-label={`${r.status === 'archived' ? 'Pulihkan' : 'Arsipkan'} ${r.name}`}>{r.status === 'archived' ? 'Pulihkan' : 'Arsipkan'}</button>
              </span>
            ) },
          ]
          const active = subjects.filter((s) => s.status === 'active')
          return (
            <>
              <StatGrid>
                <AdminStat label="Total mapel" value={subjects.length} unit="Mapel" icon={BookOpen} foot="Terdaftar di kurikulum" />
                <AdminStat label="Mapel aktif" value={active.length} unit="Mapel" icon={CircleCheck} foot="Bisa dijadwalkan" />
                <AdminStat label="Diarsipkan" value={subjects.length - active.length} unit="Mapel" icon={Archive} tone="gray" />
                <AdminStat label="Guru pengampu" value={new Set(active.map((s) => s.teacherId)).size} unit="Guru" icon={UserRound} foot="Mengampu mapel aktif" />
              </StatGrid>
              <DataTable variant="admin" columns={columns} rows={subjects} pageSize={8} searchKeys={searchKeys} searchPlaceholder="Cari mapel, kode, guru" />
              {form && <FormModal key={form === 'new' ? 'new' : form.id} open title={form === 'new' ? 'Tambah mapel' : 'Ubah mapel'} fields={fields} initial={form === 'new' ? {} : form} onSubmit={save} onClose={() => setForm(null)} />}
            </>
          )
        }}
      </AsyncBoundary>
    </>
  )
}

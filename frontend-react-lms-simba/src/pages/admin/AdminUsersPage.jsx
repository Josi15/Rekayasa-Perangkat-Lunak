import { useCallback, useMemo, useState } from 'react'
import { Plus, Users, GraduationCap, UserRound, UserX } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import DataTable from '../../components/tables/DataTable'
import FormModal from '../../components/forms/FormModal'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { userService, serviceMode } from '../../services'
import { roleLabel } from '../../utils/format'

const searchKeys = ['name', 'email', 'username']
const roles = Object.entries(roleLabel).map(([value, label]) => ({ value, label }))
const statuses = [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }, { value: 'pending', label: 'Menunggu' }]
const TABS = [['', 'Semua'], ['teacher', 'Guru'], ['student', 'Siswa'], ['admin', 'Admin']]

export default function AdminUsersPage() {
  const { user: me } = useAuth()
  const { notify } = useToast()
  const state = useAsync(useCallback(() => userService.list(), []))
  const [role, setRole] = useState('')
  const [form, setForm] = useState(null) // null | 'new' | user
  const [toggle, setToggle] = useState(null)

  const fields = useMemo(() => [
    { name: 'name', label: 'Nama', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'username', label: 'Username', required: true },
    { name: 'role', label: 'Peran', type: 'select', options: roles, required: true },
    { name: 'status', label: 'Status', type: 'select', options: statuses, required: true },
    ...(serviceMode.live ? [
      { name: 'nisn', label: 'NISN', hint: 'Wajib untuk siswa (10 digit). Dipakai untuk login.' },
      { name: 'nip', label: 'NIP', hint: 'Wajib untuk guru (18 digit). Dipakai untuk login.' },
    ] : []),
    serviceMode.live
      ? { name: 'password', label: 'Kata sandi sementara', type: 'password', hint: 'Wajib saat membuat akun: minimal 10 karakter, huruf besar, huruf kecil, dan angka. Kosongkan saat mengubah bila tidak diganti.' }
      : { name: 'password', label: 'Kata sandi sementara (demo)', type: 'password', hint: 'Opsional. Hanya disimpan di memori; kosongkan bila akun belum boleh login.' },
  ], [])

  const save = async (v) => {
    if (form === 'new') await userService.create(v)
    else await userService.update(form.id, v, me.id)
    notify(form === 'new' ? 'Pengguna ditambahkan (simulasi).' : 'Pengguna diperbarui (simulasi).', 'success')
    setForm(null); state.reload()
  }
  const flip = async () => {
    const next = toggle.status === 'active' ? 'inactive' : 'active'
    try { await userService.setStatus(toggle.id, next, me.id); notify(next === 'active' ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.', 'success'); state.reload() }
    catch (e) { notify(e.message, 'error') }
    setToggle(null)
  }

  return (
    <>
      <AdminHead group="Master Data" title="Manajemen Pengguna" description="Kelola akun siswa, guru, dan administrator."
        actions={<button className="btn-primary" onClick={() => setForm('new')}><Plus size={16} /> Tambah pengguna</button>} />
      <AsyncBoundary state={state}>
        {(users) => {
          const on = (r) => users.filter((u) => u.role === r && u.status === 'active').length
          const rows = users.filter((u) => !role || u.role === role)
          const columns = [
            { key: 'name', header: 'Nama', render: (r) => (
              <span className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-700">{(r.name[0] ?? '?').toUpperCase()}</span><span className="font-semibold text-slate-900">{r.name}</span></span>
            ) },
            { key: 'username', header: 'Username' }, { key: 'email', header: 'Email' },
            { key: 'role', header: 'Peran', render: (r) => <Pill>{roleLabel[r.role]}</Pill> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'act', header: '', render: (r) => (
              <span className="flex gap-3 whitespace-nowrap">
                <button className="text-brand-600 hover:underline" onClick={() => setForm(r)} aria-label={`Ubah ${r.name}`}>Ubah</button>
                {r.id !== me.id && <button className="text-slate-600 hover:underline" onClick={() => setToggle(r)} aria-label={`${r.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'} ${r.name}`}>{r.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button>}
              </span>
            ) },
          ]
          return (
            <>
              <StatGrid>
                <AdminStat label="Total akun" value={users.length} unit="Akun" icon={Users} foot={`${users.filter((u) => u.status === 'active').length} aktif`} />
                <AdminStat label="Siswa aktif" value={on('student')} unit="Siswa" icon={GraduationCap} />
                <AdminStat label="Guru aktif" value={on('teacher')} unit="Guru" icon={UserRound} tone="gray" />
                <AdminStat label="Nonaktif / menunggu" value={users.filter((u) => u.status !== 'active').length} unit="Akun" icon={UserX} tone="warn" foot="Tidak bisa masuk ke sistem" />
              </StatGrid>
              <DataTable variant="admin" columns={columns} rows={rows} pageSize={8} searchKeys={searchKeys} searchPlaceholder="Cari nama, email, username"
                toolbar={<div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Filter peran">{TABS.map(([k, l]) => <button key={k || 'all'} role="tab" aria-selected={role === k} onClick={() => setRole(k)} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${role === k ? 'bg-white text-slate-900 shadow-card' : 'text-slate-600'}`}>{l}</button>)}</div>} />
            </>
          )
        }}
      </AsyncBoundary>
      {form && <FormModal key={form === 'new' ? 'new' : form.id} open title={form === 'new' ? 'Tambah pengguna' : 'Ubah pengguna'} fields={fields} initial={form === 'new' ? { role: 'student', status: 'active' } : form} onSubmit={save} onClose={() => setForm(null)} />}
      <ConfirmationDialog open={!!toggle} title={toggle?.status === 'active' ? 'Nonaktifkan akun?' : 'Aktifkan akun?'}
        message={toggle && `${toggle.name} ${toggle.status === 'active' ? 'tidak akan bisa masuk lagi sampai diaktifkan kembali.' : 'akan bisa masuk kembali.'}`}
        confirmLabel={toggle?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'} onCancel={() => setToggle(null)} onConfirm={flip} />
    </>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, DoorOpen, CalendarClock, ChevronRight, UserPlus, School, Megaphone, BookOpen, Radio } from 'lucide-react'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import TopBar from '../../components/layout/TopBar'
import { useAsync } from '../../hooks/useAsync'
import { userService, classService, subjectService, announcementService, scheduleService } from '../../services'
import { roleLabel, formatDate } from '../../utils/format'

const Label = ({ children }) => <p className="text-sm uppercase tracking-wide text-slate-500">{children}</p>
const IconBox = ({ children }) => <div className="h-fit rounded-xl bg-brand-100 p-3 text-brand-600">{children}</div>
const Pill = ({ children }) => <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-100 px-2.5 py-1.5 text-xs font-semibold text-brand-700">{children}</span>
const todayIndex = () => new Date().getDay() || 7 // 1=Senin … 7=Minggu (sama dengan jadwal)
const TABS = [['all', 'Semua'], ['teacher', 'Guru'], ['student', 'Siswa']]

function Stats({ users, classes, sessions }) {
  const by = (r) => users.filter((u) => u.role === r && u.status === 'active').length
  const active = users.filter((u) => u.status === 'active').length
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="panel space-y-5">
        <div className="flex justify-between"><div><Label>Total pengguna aktif</Label><p className="mt-2 text-4xl font-extrabold">{active} <span className="text-base font-normal text-slate-500">Akun</span></p></div><IconBox><UserRound size={22} /></IconBox></div>
        <p className="flex flex-wrap gap-x-4 text-xs text-slate-500"><span>{by('student')} Siswa</span><span>{by('teacher')} Guru</span><span>{by('admin')} Admin</span></p>
      </div>
      <div className="panel space-y-5">
        <div className="flex justify-between"><div><Label>Rombongan belajar</Label><p className="mt-2 text-4xl font-extrabold">{classes.length} <span className="text-base font-normal text-slate-500">Kelas</span></p></div><IconBox><DoorOpen size={22} /></IconBox></div>
        <p className="text-xs text-slate-500">Terdaftar di sistem</p>
      </div>
      <div className="panel space-y-5">
        <div className="flex justify-between"><div><Label>Sesi KBM hari ini</Label><p className="mt-2 text-4xl font-extrabold">{sessions.length} <span className="text-base font-normal text-slate-500">Sesi</span></p></div><IconBox><CalendarClock size={22} /></IconBox></div>
        <p className="text-xs text-slate-500">Dari jadwal pelajaran mingguan</p>
      </div>
    </div>
  )
}

function Sessions({ sessions }) {
  return (
    <section className="panel">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold"><Radio size={16} className="text-brand-600" /> Jadwal KBM Hari Ini</h2><Link to="/admin/schedule" className="text-sm font-semibold text-brand-700 hover:underline">Jadwal lengkap</Link></div>
      {sessions.length === 0 ? <EmptyState title="Tidak ada sesi KBM hari ini" /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="bg-brand-50 text-xs uppercase tracking-wide text-slate-600"><th className="rounded-l-lg px-3 py-3">Kelas & Mapel</th><th className="px-3 py-3">Guru Pengampu</th><th className="rounded-r-lg px-3 py-3">Waktu</th></tr></thead>
            <tbody>{sessions.map((s) => (
              <tr key={s.id} className="odd:bg-white even:bg-slate-50/60">
                <td className="px-3 py-3"><p className="font-semibold">{s.className}</p><p className="text-xs text-slate-500">{s.subjectName}</p></td>
                <td className="px-3 py-3 font-medium">{s.teacherName}</td>
                <td className="px-3 py-3"><span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs">{s.endTime ? `${s.time} - ${s.endTime}` : s.time}</span></td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function QuickUsers({ users, query, onDetail }) {
  const [tab, setTab] = useState('all')
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...users].sort((a, b) => b.id - a.id).filter((u) => (tab === 'all' || u.role === tab) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q))).slice(0, 5)
  }, [users, tab, query])
  return (
    <section className="panel">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-bold">Pengguna Terbaru</h2><p className="text-xs text-slate-500">5 akun terakhir yang dibuat</p></div>
        <div className="flex rounded-xl bg-slate-100 p-1" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === k ? 'bg-white text-slate-900 shadow-card' : 'text-slate-600'}`}>{l}</button>)}</div>
      </div>
      {rows.length === 0 ? <EmptyState title="Pengguna tidak ditemukan" /> : (
        <ul className="space-y-2">{rows.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-700">{(u.name[0] ?? '?').toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.name} <span className="ml-1 rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">{roleLabel[u.role]}</span></p><p className="truncate text-xs text-slate-500">{u.email || '-'}</p></div>
            <StatusBadge status={u.status} />
            <button className="btn-secondary !py-1.5" onClick={() => onDetail(u)}>Detail</button>
          </li>))}</ul>
      )}
    </section>
  )
}

function LatestAnnouncement({ item }) {
  return (
    <section className="panel">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Pemberitahuan & Siaran Sekolah</h2><Link to="/admin/announcements" className="text-sm font-semibold text-brand-700 hover:underline">Kelola</Link></div>
      {!item ? <EmptyState title="Belum ada pengumuman" /> : (
        <article className="rounded-xl bg-brand-50 p-5">
          <p className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><Pill>{item.category}</Pill><span>Dipublikasi: {formatDate(item.createdAt)}</span></p>
          <h3 className="text-base font-bold">{item.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.body}</p>
        </article>
      )}
    </section>
  )
}

const actions = [
  { to: '/admin/users', icon: UserPlus, title: 'Tambah Pengguna', desc: 'Buat akun siswa, guru, atau admin' },
  { to: '/admin/classes', icon: School, title: 'Kelola Kelas', desc: 'Buat kelas dan atur anggota' },
  { to: '/admin/subjects', icon: BookOpen, title: 'Kelola Mata Pelajaran', desc: 'Atur mapel dan guru pengampu' },
  { to: '/admin/announcements', icon: Megaphone, title: 'Buat Pengumuman', desc: 'Siarkan informasi ke seluruh sekolah' },
]

export default function AdminDashboard() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const load = useCallback(() => Promise.all([userService.list(), classService.list(), subjectService.list(), announcementService.list(), scheduleService.list()]), [])
  const { data, loading, error, reload } = useAsync(load)
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const [users, classes, subjects, announcements, schedules] = data
  const sessions = schedules.filter((s) => s.dayIndex === todayIndex())
  return (
    <div className="space-y-6">
      <TopBar query={query} onQuery={setQuery} placeholder="Cari pengguna..." />
      <div>
        <p className="mb-1 text-sm text-slate-500">SIMBA Admin › <span className="font-semibold text-brand-700">Master Control</span></p>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Kontrol Administrator</h1>
      </div>
      <Stats users={users} classes={classes} sessions={sessions} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2"><Sessions sessions={sessions} /><QuickUsers users={users} query={query} onDetail={setSelected} /><LatestAnnouncement item={announcements[0]} /></div>
        <div className="space-y-6">
          <section className="panel">
            <h2 className="text-lg font-bold">Ringkasan Sistem</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {[['Mata pelajaran', subjects.length], ['Kelas', classes.length], ['Pengumuman', announcements.length], ['Akun nonaktif', users.filter((u) => u.status !== 'active').length]].map(([l, v]) => (
                <li key={l} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2.5"><span className="text-slate-600">{l}</span><b>{v}</b></li>))}
            </ul>
          </section>
          <section className="panel">
            <h2 className="text-lg font-bold">Tindakan Cepat</h2>
            <ul className="mt-4 space-y-2">{actions.map(({ to, icon: Icon, title, desc }) => (
              <li key={to}><Link to={to} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-brand-50"><span className="rounded-lg bg-slate-200 p-2 text-slate-700"><Icon size={16} /></span><span className="flex-1"><b className="block text-sm">{title}</b><span className="text-xs text-slate-500">{desc}</span></span><ChevronRight size={16} className="text-slate-400" /></Link></li>))}</ul>
          </section>
        </div>
      </div>
      <Modal open={!!selected} title="Detail pengguna" onClose={() => setSelected(null)} footer={<button className="btn-secondary" onClick={() => setSelected(null)}>Tutup</button>}>
        {selected && <dl className="space-y-1"><dt className="text-slate-500">Nama</dt><dd className="font-medium">{selected.name}</dd><dt className="text-slate-500">Email</dt><dd>{selected.email || '-'}</dd><dt className="text-slate-500">Peran</dt><dd>{roleLabel[selected.role]}</dd></dl>}
      </Modal>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, FolderOpen, Users, FilePen, ArrowUpDown, Plus } from 'lucide-react'
import TopBar from '../../components/layout/TopBar'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import NumberedPagination from '../../components/tables/NumberedPagination'
import MaterialTable from './materials/MaterialTable'
import QuickUploadPanel from './materials/QuickUploadPanel'
import { fileInfo } from './materials/fileInfo'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { teacherService } from '../../services'
import { teacherHome } from '../../data/teacherHome'

const PAGE_SIZE = 5
const sorters = { newest: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id, title: (a, b) => a.title.localeCompare(b.title) }
const Stat = ({ icon: Icon, tone, label, value, unit }) => (
  <div className="panel flex items-center gap-4"><div className={`rounded-xl p-3.5 ${tone}`}><Icon size={24} /></div>
    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="text-3xl font-extrabold">{value} <span className="text-sm font-normal text-slate-500">{unit}</span></p></div></div>
)

export default function MaterialsPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const { data, loading, error, reload } = useAsync(teacherService.materialsOverview)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [cls, setCls] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [confirm, setConfirm] = useState(null)

  const items = useMemo(() => data?.items ?? [], [data])
  const rows = useMemo(() => items.filter((m) => (tab === 'all' || fileInfo(m).format === tab) && (cls === 'all' || m.classNames.includes(cls)) && m.title.toLowerCase().includes(q.toLowerCase())).sort(sorters[sort]), [items, tab, cls, q, sort])
  const classNames = useMemo(() => [...new Set(items.flatMap((m) => m.classNames))], [items])
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const count = (fmt) => items.filter((m) => fileInfo(m).format === fmt).length
  const allSelected = rows.length > 0 && rows.every((m) => selected.includes(m.id))
  const reset = (fn) => (v) => { fn(v); setPage(1) }

  const doDelete = async () => {
    try {
      for (const id of confirm.ids) await teacherService.deleteMaterial(id)
      notify(`${confirm.ids.length} materi dihapus (data simulasi).`, 'success')
      setSelected((s) => s.filter((id) => !confirm.ids.includes(id))); reload()
    } catch (e) { notify(e.message, 'error') }
    setConfirm(null)
  }
  const tabs = [['all', `Semua Materi (${items.length})`], ['PDF', `Modul PDF (${count('PDF')})`], ['PPTX', `Slide PPT (${count('PPTX')})`]]

  return (
    <div>
      <TopBar query={q} onQuery={reset(setQ)} placeholder="Cari materi" name={user.name} subtitle={`Guru ${teacherHome.subject} & Wali Kelas ${teacherHome.homeroom.name}`} />
      <div className="space-y-6">
        <section className="panel relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-200/60 blur-2xl" />
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700"><BadgeCheck size={14} />Kurikulum Merdeka</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Manajemen Modul & Perangkat Ajar</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-slate-700">{teacherHome.subject} Fase E • Kelas X & XI <span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-xs font-bold text-brand-700">T.A. {teacherHome.academicYear.split(' ')[0]}</span></p>
        </section>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Stat icon={FolderOpen} tone="bg-brand-200 text-brand-700" label="Total Materi Terbit" value={items.filter((m) => m.status === 'published').length} unit="berkas" />
              <Stat icon={Users} tone="bg-brand-100 text-brand-700" label="Siswa Terjangkau" value={data.reach} unit="siswa aktif" />
              <Stat icon={FilePen} tone="bg-slate-100 text-red-700" label="Draf Modul" value={items.filter((m) => m.status === 'draft').length} unit="belum rilis" />
            </div>
            <div className="grid items-start gap-6 xl:grid-cols-[1fr_300px]">
              <div className="min-w-0 space-y-4">
                <div className="panel flex flex-wrap items-center gap-2 !p-3">
                  {tabs.map(([k, l]) => <button key={k} onClick={() => { setTab(k); setPage(1) }} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${tab === k ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-brand-100'}`}>{l}</button>)}
                  <label className="ml-auto flex items-center gap-2 text-sm text-slate-500">Sasaran:
                    <select className="rounded-lg bg-brand-50 px-3 py-2 font-semibold text-slate-800" value={cls} onChange={(e) => { setCls(e.target.value); setPage(1) }} aria-label="Filter sasaran">
                      <option value="all">Semua Kelas Sasaran</option>{classNames.map((c) => <option key={c}>{c}</option>)}</select></label>
                </div>
                <div className="panel !p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" aria-label="Pilih semua" checked={allSelected} onChange={() => setSelected(allSelected ? [] : rows.map((m) => m.id))} />Pilih Semua ({rows.length} Ditampilkan)</label>
                    <div className="flex items-center gap-4">
                      <Link to="/teacher/materials/new" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"><Plus size={14} />Materi teks</Link>
                      <button className="inline-flex items-center gap-1.5 text-slate-500" onClick={() => setSort(sort === 'newest' ? 'title' : 'newest')}>Urutkan: <b className="text-slate-800">{sort === 'newest' ? 'Terbaru Dirilis' : 'Judul A–Z'}</b><ArrowUpDown size={14} /></button>
                    </div>
                  </div>
                  {selected.length > 0 && <div className="flex items-center gap-3 bg-brand-50 px-4 py-2 text-sm"><b>{selected.length} dipilih</b>
                    <button className="font-semibold text-red-600 hover:underline" onClick={() => setConfirm({ ids: selected })}>Hapus terpilih</button>
                    <button className="text-slate-600 hover:underline" onClick={() => setSelected([])}>Batal pilih</button></div>}
                  <MaterialTable rows={visible} selected={selected} onToggle={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} onDelete={(m) => setConfirm({ ids: [m.id], title: m.title })} />
                  <NumberedPagination page={current} totalPages={totalPages} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
                </div>
              </div>
              <QuickUploadPanel classes={data.classOptions} onDone={reload} />
            </div>
          </>
        )}
      </div>
      <ConfirmationDialog open={!!confirm} title="Hapus materi?" message={confirm?.title ? `Materi "${confirm.title}" akan dihapus.` : `${confirm?.ids.length} materi terpilih akan dihapus.`} confirmLabel="Hapus" onCancel={() => setConfirm(null)} onConfirm={doDelete} />
    </div>
  )
}

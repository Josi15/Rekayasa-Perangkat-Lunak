import { useCallback, useMemo, useState } from 'react'
import { Library, BookOpen, CalendarClock, Info } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import DataTable from '../../components/tables/DataTable'
import DownloadButton from '../../components/common/DownloadButton'
import { useAsync } from '../../hooks/useAsync'
import { materialService } from '../../services'
import { formatDate } from '../../utils/format'

const searchKeys = ['title', 'subjectName', 'classText']

export default function AdminMaterialsPage() {
  const state = useAsync(useCallback(() => materialService.list(), []))
  const [subject, setSubject] = useState('')
  return (
    <>
      <AdminHead group="Pembelajaran & Silabus" title="Materi & Silabus Satdik" description="Arsip seluruh materi ajar yang diunggah guru pengampu. Admin memantau; pengelolaan isi dilakukan oleh guru." />
      <AsyncBoundary state={state}>
        {(items) => <Body items={items} subject={subject} setSubject={setSubject} />}
      </AsyncBoundary>
    </>
  )
}

function Body({ items, subject, setSubject }) {
  const rows = useMemo(() => items.map((m) => ({ ...m, classText: m.classNames.join(', ') })), [items])
  const subjects = useMemo(() => [...new Set(rows.map((m) => m.subjectName))].sort(), [rows])
  const shown = rows.filter((m) => !subject || m.subjectName === subject)
  const latest = rows.map((m) => m.updatedAt).filter(Boolean).sort().at(-1)
  const columns = [
    { key: 'title', header: 'Judul materi', render: (r) => <span className="font-semibold text-slate-900">{r.title}</span> },
    { key: 'subjectName', header: 'Mata pelajaran' },
    { key: 'classText', header: 'Rombel', render: (r) => r.classText || '-' },
    { key: 'updatedAt', header: 'Diperbarui', render: (r) => (r.updatedAt ? formatDate(r.updatedAt) : '-') },
    { key: 'status', header: 'Status', render: (r) => (r.status === 'draft' ? <Pill tone="gray">Draf guru</Pill> : <Pill>Terbit</Pill>) },
    { key: 'file', header: 'Berkas', render: (r) => (r.attachments[0] ? <span className="flex items-center gap-2"><span className="max-w-[12rem] truncate text-xs text-slate-500">{r.attachments[0].name}</span><DownloadButton attachment={r.attachments[0]} /></span> : <span className="text-xs text-slate-400">Tanpa berkas</span>) },
  ]
  return (
    <>
      <StatGrid cols={3}>
        <AdminStat label="Total materi" value={rows.length} unit="Modul" icon={Library} foot="Terarsip di seluruh mata pelajaran" />
        <AdminStat label="Mata pelajaran" value={subjects.length} unit="Mapel" icon={BookOpen} tone="gray" foot="Memiliki minimal satu materi" />
        <AdminStat label="Pembaruan terakhir" value={latest ? formatDate(latest) : '-'} icon={CalendarClock} foot="Tanggal materi terbaru diubah" />
      </StatGrid>
      <DataTable variant="admin" pageSize={8} columns={columns} rows={shown} searchKeys={searchKeys} searchPlaceholder="Cari materi, mapel, rombel"
        toolbar={<select aria-label="Filter mata pelajaran" className="input w-auto" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Semua mata pelajaran</option>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}</select>} />
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Info size={14} /> Halaman ini hanya-baca. Unggah, ubah, dan hapus materi dilakukan guru pengampu dari menu “Manajemen Modul”.</p>
    </>
  )
}

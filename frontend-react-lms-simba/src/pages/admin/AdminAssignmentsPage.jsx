import { useCallback, useMemo, useState } from 'react'
import { ClipboardList, DoorOpen, Lock, Award, Info } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import DataTable from '../../components/tables/DataTable'
import { useAsync } from '../../hooks/useAsync'
import { assignmentService, gradeService } from '../../services'
import { formatDateTime } from '../../utils/format'

const STATE = { published: ['Terbuka', 'brand'], archived: ['Ditutup', 'gray'], draft: ['Draf guru', 'warn'] }
const searchKeys = ['title', 'subjectName', 'className']
const gsearch = ['studentName', 'assignmentTitle', 'subjectName']

export default function AdminAssignmentsPage() {
  const state = useAsync(useCallback(() => Promise.all([assignmentService.list(), gradeService.list(), gradeService.summary()]), []))
  const [subject, setSubject] = useState('')
  return (
    <>
      <AdminHead group="Pembelajaran & Silabus" title="Bank Tugas & Evaluasi" description="Pantau tugas dan hasil penilaian seluruh mata pelajaran. Penilaian dilakukan oleh guru pengampu." />
      <AsyncBoundary state={state}>
        {([tasks, grades, summary]) => <Body tasks={tasks} grades={grades} summary={summary} subject={subject} setSubject={setSubject} />}
      </AsyncBoundary>
    </>
  )
}

function Body({ tasks, grades, summary, subject, setSubject }) {
  const subjects = useMemo(() => [...new Set(tasks.map((t) => t.subjectName))].sort(), [tasks])
  const shown = tasks.filter((t) => !subject || t.subjectName === subject)
  const latest = useMemo(() => [...grades].sort((a, b) => String(b.gradedAt).localeCompare(String(a.gradedAt))).slice(0, 30), [grades])
  const open = tasks.filter((t) => t.status === 'published').length
  const columns = [
    { key: 'title', header: 'Judul tugas', render: (r) => <span className="font-semibold text-slate-900">{r.title}</span> },
    { key: 'subjectName', header: 'Mata pelajaran' },
    { key: 'className', header: 'Rombel' },
    { key: 'dueDate', header: 'Batas waktu', render: (r) => (r.dueDate ? formatDateTime(r.dueDate) : '-') },
    { key: 'submittedCount', header: 'Terkumpul', render: (r) => r.submittedCount ?? '-' },
    { key: 'status', header: 'Status', render: (r) => { const [l, t] = STATE[r.status] ?? [r.status, 'gray']; return <Pill tone={t}>{l}</Pill> } },
  ]
  const gcolumns = [
    { key: 'studentName', header: 'Siswa', render: (r) => <span className="font-semibold text-slate-900">{r.studentName}</span> },
    { key: 'assignmentTitle', header: 'Tugas / kuis' },
    { key: 'subjectName', header: 'Mata pelajaran' },
    { key: 'score', header: 'Nilai', render: (r) => <Pill tone={r.score >= 75 ? 'brand' : 'warn'}>{r.score}</Pill> },
  ]
  return (
    <>
      <StatGrid>
        <AdminStat label="Total tugas" value={tasks.length} unit="Tugas" icon={ClipboardList} foot={`${subjects.length} mata pelajaran`} />
        <AdminStat label="Sedang terbuka" value={open} unit="Tugas" icon={DoorOpen} foot="Masih menerima pengumpulan" />
        <AdminStat label="Sudah ditutup" value={tasks.filter((t) => t.status === 'archived').length} unit="Tugas" icon={Lock} tone="gray" foot="Pengumpulan dihentikan" />
        <AdminStat label="Rerata nilai" value={summary.average ?? '-'} icon={Award} foot={`${summary.count} nilai tercatat${summary.highest != null ? ` · tertinggi ${summary.highest}` : ''}`} />
      </StatGrid>
      <h2 className="mb-3 text-lg font-bold">Daftar Tugas</h2>
      <DataTable variant="admin" pageSize={6} columns={columns} rows={shown} searchKeys={searchKeys} searchPlaceholder="Cari tugas, mapel, rombel"
        toolbar={<select aria-label="Filter mata pelajaran" className="input w-auto" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Semua mata pelajaran</option>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}</select>} />
      <h2 className="mb-3 mt-8 text-lg font-bold">Nilai Terbaru</h2>
      <DataTable variant="admin" pageSize={6} columns={gcolumns} rows={latest} searchKeys={gsearch} searchPlaceholder="Cari siswa atau tugas" />
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Info size={14} /> Halaman ini hanya-baca. Membuat tugas dan memberi nilai dilakukan guru dari menu “Bank Tugas & Evaluasi” dan “Buku Nilai & Leger”.</p>
    </>
  )
}

import { useCallback, useMemo } from 'react'
import { CircleHelp, Radio, Inbox, Award, ExternalLink, Info } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import DataTable from '../../components/tables/DataTable'
import { useAsync } from '../../hooks/useAsync'
import { quizService } from '../../services'

const STATE = { running: ['Berjalan', 'brand'], scheduled: ['Terjadwal', 'warn'], finished: ['Selesai', 'gray'], draft: ['Belum ada respon', 'gray'] }
const searchKeys = ['title', 'rombel', 'subjectName']

export default function AdminQuizPage() {
  const state = useAsync(useCallback(() => quizService.list(), []))
  return (
    <>
      <AdminHead group="Pembelajaran & Silabus" title="Kuis Form & CBT" description="Pantau kuis Google Form seluruh mata pelajaran. Kuis dibuat dan dikelola oleh guru pengampu." />
      <AsyncBoundary state={state}>{(data) => <Body data={data} />}</AsyncBoundary>
    </>
  )
}

function Body({ data }) {
  const { quizzes, stats } = data
  const rows = useMemo(() => quizzes.map((q) => ({ ...q, subjectName: q.subjectName ?? '' })), [quizzes])
  const columns = [
    { key: 'title', header: 'Judul kuis', render: (r) => <span className="font-semibold text-slate-900">{r.title}</span> },
    { key: 'subjectName', header: 'Mata pelajaran', render: (r) => r.subjectName || '-' },
    { key: 'rombel', header: 'Rombel' },
    { key: 'type', header: 'Jenis', render: (r) => r.type ?? '-' },
    { key: 'status', header: 'Status', render: (r) => { const [l, t] = STATE[r.status] ?? [r.status, 'gray']; return <Pill tone={t}>{l}</Pill> } },
    { key: 'done', header: 'Respon', render: (r) => r.done ?? 0 },
    { key: 'link', header: 'Tautan', render: (r) => { const href = r.link ?? r.formUrl; return href ? <a className="inline-flex items-center gap-1 text-brand-700 hover:underline" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Buka form ${r.title}`}>Buka form <ExternalLink size={12} /></a> : <span className="text-xs text-slate-400">-</span> } },
  ]
  return (
    <>
      <StatGrid>
        <AdminStat label="Total kuis" value={quizzes.length} unit="Kuis" icon={CircleHelp} foot="Seluruh mata pelajaran" />
        <AdminStat label="Sedang berjalan" value={stats.running} unit="Kuis" icon={Radio} foot="Sudah ada respon masuk" />
        <AdminStat label="Respon masuk" value={stats.done} icon={Inbox} tone="gray" foot="Jumlah nilai kuis tercatat" />
        <AdminStat label="Rerata nilai" value={stats.avg ?? '-'} icon={Award} foot={stats.avg == null ? 'Belum dihitung oleh sistem' : 'Berdasarkan respon yang masuk'} />
      </StatGrid>
      <DataTable variant="admin" pageSize={8} columns={columns} rows={rows} searchKeys={searchKeys} searchPlaceholder="Cari kuis, mapel, rombel" />
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Info size={14} /> Halaman ini hanya-baca. Backend menyimpan kuis berupa tautan Google Form; sinkronisasi dan token CBT tidak tersedia.</p>
    </>
  )
}

import { useCallback } from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatisticCard from '../../components/common/StatisticCard'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { reportService } from '../../services'
import { toCsv, downloadCsv } from '../../utils/csv'

export default function AdminReportsPage() {
  const { notify } = useToast()
  const state = useAsync(useCallback(() => Promise.all([reportService.summary(), reportService.list()]), []))
  const download = async (id) => {
    try { const t = await reportService.table(id); downloadCsv(t.filename, toCsv(t.columns, t.rows)); notify(`${t.name} diunduh (dihitung dari data simulasi).`, 'success') }
    catch (e) { notify(e.message, 'error') }
  }
  return (
    <>
      <PageHeader title="Laporan" description="Ringkasan dihitung langsung dari data simulasi saat ini." breadcrumbs={[{ label: 'Beranda', to: '/admin/dashboard' }, { label: 'Laporan' }]} />
      <AsyncBoundary state={state}>
        {([r, catalog]) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatisticCard label="Pengguna aktif" value={`${r.users.active}/${r.users.total}`} hint={`${r.users.student} siswa · ${r.users.teacher} guru`} />
              <StatisticCard label="Tugas dipublikasikan" value={r.assignments.published} hint={`${r.assignments.total} total`} />
              <StatisticCard label="Pengumpulan" value={r.submissions.total} hint={`${r.submissions.graded} dinilai · ${r.submissions.late} terlambat`} />
              <StatisticCard label="Rata-rata nilai tugas" value={r.averageScore ?? '-'} />
              <StatisticCard label="Materi dipublikasikan" value={`${r.materials.published}/${r.materials.total}`} />
              <StatisticCard label="Kelas aktif" value={r.classes} />
              <StatisticCard label="Mapel aktif" value={r.subjects} />
              <StatisticCard label="Kehadiran sesi berjalan" value={`${r.attendance.pct}%`} hint={`${r.attendance.total} siswa (data presensi guru)`} />
            </div>
            <section className="card p-5">
              <h2 className="mb-3 font-semibold">Unduh laporan (CSV)</h2>
              <ul className="divide-y divide-slate-100 text-sm">
                {catalog.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3"><span>{c.name}</span><button className="btn-secondary" onClick={() => download(c.id)} aria-label={`Unduh ${c.name}`}><Download size={16} /> CSV</button></li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}

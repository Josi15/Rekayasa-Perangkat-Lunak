import { FolderCheck, ListFilter, CircleDashed, Download } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'
import NumberedPagination from '../../../components/tables/NumberedPagination'
import SubmissionRow from './SubmissionRow'

const PAGE_SIZE = 5
const heads = ['No', 'Nama Siswa', 'Waktu Kirim', 'File Berkas Laporan', 'Nilai (0-100)', 'Catatan Umpan Balik Guru', 'Aksi']

export default function SubmissionSheet({ rows, dueDate, filter, onFilter, q, page, onPage, onOpen, onSaved, onZip }) {
  const ungradedCount = rows.filter((r) => r.state === 'submitted').length
  const shown = rows.filter((r) => (filter === 'all' || r.state === 'submitted') && r.name.toLowerCase().includes(q.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const chip = (active) => `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${active ? 'bg-brand-200 text-brand-700' : 'bg-brand-50 text-slate-700 hover:bg-brand-100'}`
  return (
    <section className="panel !p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-brand-100 p-2.5 text-brand-700"><FolderCheck size={20} /></span>
          <div><h2 className="text-lg font-bold">Lembar Verifikasi & Penilaian Dokumen</h2><p className="text-xs text-slate-500">Menampilkan kiriman berkas peserta didik urut nomor presensi</p></div></div>
        <div className="flex flex-wrap gap-2">
          <button className={chip(filter === 'all')} onClick={() => onFilter('all')}><ListFilter size={13} />Semua ({rows.length})</button>
          <button className={chip(filter === 'ungraded')} onClick={() => onFilter('ungraded')}><CircleDashed size={13} />Belum Diperiksa ({ungradedCount})</button>
          <button className={chip(false)} onClick={onZip}><Download size={13} />Unduh Semua Zip</button>
        </div>
      </div>
      {shown.length === 0 ? <EmptyState title="Tidak ada berkas" description="Ubah filter atau kata kunci pencarian." /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-slate-600"><tr>{heads.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{shown.slice(start, start + PAGE_SIZE).map((r, i) => <SubmissionRow key={r.submission.id} no={start + i + 1} row={r} dueDate={dueDate} onOpen={onOpen} onSaved={onSaved} />)}</tbody>
        </table></div>
      )}
      <NumberedPagination page={current} totalPages={totalPages} total={shown.length} pageSize={PAGE_SIZE} onChange={onPage} noun="berkas siswa terkumpul" />
    </section>
  )
}

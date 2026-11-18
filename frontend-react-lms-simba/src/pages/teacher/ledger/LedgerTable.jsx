import { Link } from 'react-router-dom'
import { ListChecks, Search, CheckCheck } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'
import NumberedPagination from '../../../components/tables/NumberedPagination'

const PAGE_SIZE = 8
const Th = ({ children, sub, dark, right }) => <th className={`px-4 py-3 text-center text-xs font-semibold ${dark ? 'bg-brand-600 text-white' : ''}`}>{children}{sub && <span className="block text-[11px] font-normal text-slate-500">{sub}</span>}</th>

export default function LedgerTable({ rows, className, q, onQ, page, onPage, drafts, onDraft, locked, total, validDraft }) {
  const shown = rows.filter((r) => `${r.name} ${r.nisn}`.toLowerCase().includes(q.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  return (
    <section className="panel !p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-bold"><ListChecks size={18} className="text-brand-700" />Tabel Leger Siswa & Rekapitulasi Nilai<span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium">{total} Terdata</span>
          <Link to="/teacher/grading/recap" className="text-xs font-semibold text-brand-700 hover:underline">Rekap per tugas →</Link></h2>
        <div className="relative w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Cari nama atau NISN" placeholder="Cari nama atau NISN..." value={q} onChange={(e) => onQ(e.target.value)} className="w-full rounded-lg bg-brand-50 py-2 pl-9 pr-3 text-sm outline-none" /></div>
      </div>
      {shown.length === 0 ? <EmptyState title="Siswa tidak ditemukan" /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
          <thead className="bg-brand-50 text-slate-800"><tr><th className="px-4 py-3 text-left text-xs">No</th><th className="px-4 py-3 text-left text-xs">NISN</th><th className="px-4 py-3 text-left text-xs">Nama Lengkap Siswa</th>
            <Th sub="Formatif (30%)">Rata Tugas</Th><Th sub="Formatif (30%)">Rata Kuis CBT</Th><Th sub="Sumatif (40%)">Skor PTS</Th><Th dark>Nilai Akhir (NA)</Th><Th>Predikat</Th><Th>Status</Th></tr></thead>
          <tbody>{shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((r, i) => {
            const bad = drafts[r.studentId] !== undefined && !validDraft(drafts[r.studentId])
            return (
              <tr key={r.studentId} className={i % 2 ? 'bg-brand-50/50' : ''}>
                <td className="px-4 py-3 text-slate-500">{String(r.no).padStart(2, '0')}</td><td className="px-4 py-3 font-mono text-xs text-slate-500">{r.nisn}</td><td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3 text-center">{r.tugas.toFixed(1)}</td><td className="px-4 py-3 text-center">{r.cbt.toFixed(1)}</td>
                <td className="px-4 py-3 text-center"><input type="number" step="0.5" aria-label={`Skor PTS ${r.name}`} aria-invalid={bad} disabled={locked} value={drafts[r.studentId] ?? r.pts} onChange={(e) => onDraft(r.studentId, e.target.value)} className={`w-16 rounded-md bg-transparent py-1 text-center outline-none hover:bg-white focus:bg-white focus:ring-2 disabled:opacity-70 ${bad ? 'ring-2 ring-red-400' : 'focus:ring-brand-200'}`} /></td>
                <td className="px-4 py-3 text-center text-lg font-bold text-brand-700">{r.na.toFixed(1)}</td><td className="px-4 py-3 text-center font-bold">{r.predikat}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${r.tuntas ? 'bg-brand-200 text-brand-700' : 'bg-red-100 text-red-700'}`}>{r.tuntas && <CheckCheck size={12} />}{r.tuntas ? 'Tuntas' : 'Belum Tuntas'}</span></td>
              </tr>)
          })}</tbody>
        </table></div>
      )}
      <NumberedPagination page={current} totalPages={totalPages} total={shown.length} pageSize={PAGE_SIZE} onChange={onPage} noun={`siswa aktif di kelas ${className}`} />
    </section>
  )
}

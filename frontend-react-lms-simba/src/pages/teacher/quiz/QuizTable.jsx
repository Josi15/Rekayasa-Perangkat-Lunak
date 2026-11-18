import { Table2, ListChecks, Award, MoreVertical, Eye, RefreshCw, Link2, Play, Square, Download, Trash2 } from 'lucide-react'
import Dropdown from '../../../components/common/Dropdown'
import EmptyState from '../../../components/common/EmptyState'
import { formatDue, timeAgo } from '../../../utils/format'

const src = { google: ['Google Form', Table2], engine: ['SIMBA Engine', ListChecks], mandiri: ['Pengayaan Mandiri', Award] }
const chip = { running: ['Aktif', 'bg-brand-200 text-brand-700'], finished: ['Selesai', 'bg-slate-100 text-slate-600'], scheduled: ['Terjadwal', 'bg-slate-100 text-slate-700'] }

export default function QuizTable({ rows, updatedAt, on }) {
  const menu = (q) => [
    ...(q.status === 'scheduled' ? [{ label: 'Mulai Sekarang', icon: Play, onClick: () => on.status(q, 'running', 'Kuis dimulai (simulasi).') }] : []),
    ...(q.status !== 'scheduled' ? [{ label: 'Lihat Respon', icon: Eye, onClick: () => on.responses(q) }, { label: 'Tarik Nilai ke Leger', icon: RefreshCw, onClick: () => on.sync(q) }] : []),
    ...(q.status === 'running' ? [{ label: 'Akhiri Kuis', icon: Square, onClick: () => on.status(q, 'finished', 'Kuis diakhiri.') }] : []),
    ...(q.formUrl ? [{ label: 'Salin Tautan', icon: Link2, onClick: () => on.copy(q.formUrl, 'Tautan form disalin.') }] : []),
    ...(q.status === 'finished' ? [{ label: 'Unduh Rekap (CSV)', icon: Download, onClick: () => on.csv(q) }] : []),
    { label: 'Hapus', icon: Trash2, onClick: () => on.remove(q) },
  ]
  return (
    <section className="rounded-2xl bg-brand-50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-bold"><Table2 size={18} className="text-brand-700" />Daftar Kuis & Rekap Asesmen</h2><span className="text-xs text-slate-600">Diperbarui: {timeAgo(updatedAt)}</span></div>
      {rows.length === 0 ? <EmptyState title="Belum ada kuis" description="Buat kuis baru atau ubah filter." /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs font-semibold uppercase text-slate-600"><tr>{['Nama Kuis & Bab', 'Rombel', 'Tipe', 'Batas Waktu', 'Respon', 'Rerata', 'Status & Aksi'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
          <tbody>{rows.map((q) => {
            const [label, Icon] = src[q.source], [st, tone] = chip[q.status]
            return (
              <tr key={q.id} className="border-t border-slate-200/70">
                <td className="px-3 py-4"><div className="flex items-start gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-brand-700" /><div><p className="font-bold">{q.title}</p><p className="text-xs text-slate-500">{label} • {q.questionCount} Soal</p></div></div></td>
                <td className="px-3 py-4">{q.rombel}</td>
                <td className="px-3 py-4"><span className="rounded bg-white px-2 py-1 text-xs">{q.questionCount} {q.type}</span></td>
                <td className="whitespace-nowrap px-3 py-4">{formatDue(q.dueAt)}</td>
                <td className={`px-3 py-4 font-bold ${q.status === 'running' ? 'text-brand-700' : q.done === 0 ? 'font-normal text-slate-400' : ''}`}>{q.done} / {q.total}</td>
                <td className="px-3 py-4 font-bold">{q.avg ?? <span className="font-normal text-slate-400">--</span>}</td>
                <td className="px-3 py-4"><div className="flex items-center gap-2"><div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{st}</span>{q.syncedAt && <p className="mt-1 text-[11px] text-brand-700">Tersinkron</p>}</div>
                  <Dropdown label={`Aksi ${q.title}`} trigger={<MoreVertical size={16} />} items={menu(q)} /></div></td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
    </section>
  )
}

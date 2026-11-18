import { Link } from 'react-router-dom'
import { FileText, Presentation, Eye, Pencil, Trash2 } from 'lucide-react'
import StatusBadge from '../../../components/common/StatusBadge'
import EmptyState from '../../../components/common/EmptyState'
import { fileInfo } from './fileInfo'

const dot = { PDF: 'bg-red-600', DOCX: 'bg-brand-700', PPTX: 'bg-fuchsia-700', TEKS: 'bg-slate-400' }
const box = { PDF: 'bg-brand-200 text-brand-700', DOCX: 'bg-brand-100 text-brand-700', PPTX: 'bg-slate-200 text-slate-700', TEKS: 'bg-slate-100 text-slate-600' }

export default function MaterialTable({ rows, selected, onToggle, onDelete }) {
  if (rows.length === 0) return <EmptyState title="Materi tidak ditemukan" description="Ubah filter atau kata kunci pencarian." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-brand-50 text-xs uppercase tracking-wide text-slate-600">
          <tr><th className="w-10 px-4 py-3">#</th><th className="px-4 py-3">Judul Materi & Bab</th><th className="px-4 py-3">Format & Ukuran</th><th className="px-4 py-3">Target Rombel</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const info = fileInfo(m), Icon = info.format === 'PPTX' ? Presentation : FileText
            return (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/60">
                <td className="px-4 py-4"><input type="checkbox" aria-label={`Pilih ${m.title}`} checked={selected.includes(m.id)} onChange={() => onToggle(m.id)} /></td>
                <td className="px-4 py-4"><div className="flex items-center gap-3"><span className={`rounded-lg p-2.5 ${box[info.format] ?? box.PDF}`}><Icon size={20} /></span>
                  <div className="min-w-0"><p className="font-semibold">{m.title}</p><p className="text-xs text-slate-500">{m.description}</p></div></div></td>
                <td className="whitespace-nowrap px-4 py-4"><span className="inline-flex items-center gap-2 font-medium"><span className={`h-2 w-2 rounded-full ${dot[info.format] ?? 'bg-red-600'}`} />{info.label}</span></td>
                <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{m.classNames.map((c) => <span key={c} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{c}</span>)}</div></td>
                <td className="px-4 py-4"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-4"><div className="flex justify-end gap-1">
                  <Link className="rounded p-1.5 hover:bg-brand-100" to={`/teacher/materials/${m.id}`} aria-label="Detail"><Eye size={16} /></Link>
                  <Link className="rounded p-1.5 hover:bg-brand-100" to={`/teacher/materials/${m.id}/edit`} aria-label="Edit"><Pencil size={16} /></Link>
                  <button className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label="Hapus" onClick={() => onDelete(m)}><Trash2 size={16} /></button></div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

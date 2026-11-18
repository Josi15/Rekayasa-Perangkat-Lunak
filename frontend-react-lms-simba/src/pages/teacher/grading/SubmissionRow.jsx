import { useState } from 'react'
import { CheckCircle2, Clock3, ExternalLink, FileText, Check } from 'lucide-react'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog'
import { useToast } from '../../../contexts/ToastContext'
import { teacherAssignmentService as svc } from '../../../services'
import { formatSentTime, lateHours } from '../../../utils/format'

// Nilai & umpan balik diedit langsung di baris. Mengubah nilai yang sudah ada memerlukan konfirmasi.
export default function SubmissionRow({ no, row, dueDate, onOpen, onSaved }) {
  const { notify } = useToast()
  const s = row.submission
  const [score, setScore] = useState(s.score ?? '')
  const [feedback, setFeedback] = useState(s.feedback ?? '')
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const dirty = String(score) !== String(s.score ?? '') || feedback !== (s.feedback ?? '')

  const trySave = () => {
    const n = Number(score)
    const e = score === '' ? 'Nilai wajib diisi.' : !Number.isFinite(n) || n < 0 || n > 100 ? 'Nilai harus antara 0 dan 100.' : ''
    setErr(e)
    if (!e) (s.status === 'graded' ? setConfirm(true) : save())
  }
  const save = async () => {
    setConfirm(false); setSaving(true)
    try { await svc.grade(s.id, { score, feedback }); notify('Nilai disimpan (data simulasi).', 'success'); onSaved() }
    catch (e) { notify(e.message, 'error'); setSaving(false) }
  }
  const fileName = s.attachments[0]?.name
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-4 text-slate-500">{String(no).padStart(2, '0')}</td>
      <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-200 text-xs font-bold text-brand-700">{row.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
        <div><p className="font-semibold">{row.name}</p><p className="text-xs text-slate-500">NISN: {row.nisn}</p></div></div></td>
      <td className="px-4 py-4 text-xs">
        {s.late ? <p className="flex items-center gap-1.5 font-semibold text-red-700"><Clock3 size={13} />Terlambat ({lateHours(s.submittedAt, dueDate)} Jam)</p> : <p className="flex items-center gap-1.5 font-semibold text-brand-700"><CheckCircle2 size={13} />Tepat Waktu</p>}
        <p className="mt-0.5 text-slate-500">{formatSentTime(s.submittedAt)}</p></td>
      <td className="px-4 py-4"><button onClick={() => onOpen(row)} aria-label={`Buka berkas ${row.name}`} className="inline-flex max-w-[190px] items-center gap-2 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-medium hover:bg-brand-200"><FileText size={14} className="shrink-0 text-red-700" /><span className="truncate">{fileName ?? 'Jawaban teks'}</span><ExternalLink size={12} className="shrink-0" /></button></td>
      <td className="px-4 py-4"><input type="number" data-score-input aria-label={`Nilai ${row.name}`} value={score} placeholder="--" onChange={(e) => setScore(e.target.value)} className={`w-16 rounded-lg py-1.5 text-center text-sm font-bold outline-none ${score === '' ? 'bg-slate-100' : 'bg-brand-100 text-brand-700'}`} />
        {err && <p role="alert" className="mt-1 w-28 text-[11px] text-red-600">{err}</p>}</td>
      <td className="px-4 py-4"><input aria-label={`Umpan balik ${row.name}`} value={feedback} placeholder="Tulis feedback singkat untuk siswa..." onChange={(e) => setFeedback(e.target.value)} className="w-56 rounded-lg bg-slate-100 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-200" /></td>
      <td className="px-4 py-4"><button aria-label={`Simpan nilai ${row.name}`} disabled={!dirty || saving} onClick={trySave} className="rounded-lg bg-brand-600 p-2 text-white disabled:bg-slate-200 disabled:text-slate-400"><Check size={16} /></button>
        <ConfirmationDialog open={confirm} title="Ubah nilai?" message={`Nilai ${row.name} akan diubah dari ${s.score} menjadi ${score}.`} confirmLabel="Ya, ubah" onCancel={() => setConfirm(false)} onConfirm={save} /></td>
    </tr>
  )
}

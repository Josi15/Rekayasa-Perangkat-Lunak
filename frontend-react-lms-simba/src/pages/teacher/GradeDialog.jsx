import { useState } from 'react'
import Modal from '../../components/common/Modal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import StatusBadge from '../../components/common/StatusBadge'
import FormField from '../../components/forms/FormField'
import { formatSize } from '../../components/forms/AttachmentPicker'
import { useToast } from '../../contexts/ToastContext'
import { teacherAssignmentService as svc, serviceMode } from '../../services'
import DownloadButton from '../../components/common/DownloadButton'
import { formatDateTime } from '../../utils/format'

// Detail jawaban siswa + form nilai. Mengedit nilai yang sudah ada memerlukan konfirmasi.
export default function GradeDialog({ row, onClose, onSaved }) {
  const s = row.submission
  const { notify } = useToast()
  const [score, setScore] = useState(s.score ?? '')
  const [feedback, setFeedback] = useState(s.feedback ?? '')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const n = Number(score)
    if (score === '') return 'Nilai wajib diisi.'
    if (!Number.isFinite(n) || n < 0 || n > 100) return 'Nilai harus antara 0 dan 100.'
    return ''
  }
  const trySave = () => { const e = validate(); setError(e); if (!e) (s.status === 'graded' ? setConfirm(true) : save()) }
  const save = async () => {
    setConfirm(false); setSaving(true)
    try { await svc.grade(s.id, { score, feedback }); notify('Nilai disimpan (data simulasi).', 'success'); onSaved() }
    catch (e) { notify(e.message, 'error'); setSaving(false) }
  }
  return (
    <>
      <Modal open title={`Jawaban ${row.name}`} onClose={onClose}
        footer={<><button className="btn-secondary" onClick={onClose}>Tutup</button><button className="btn-primary" disabled={saving} onClick={trySave}>{s.status === 'graded' ? 'Ubah nilai' : 'Simpan nilai'}</button></>}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={row.state} />{s.late && <StatusBadge status="late" />}<span className="text-slate-500">Dikumpulkan {formatDateTime(s.submittedAt)}</span></div>
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{s.answer || '(tanpa teks)'}</p>
          {s.attachments.length > 0 && <ul className="text-slate-600">{s.attachments.map((a) => <li key={a.name} className="flex items-center gap-2">{a.name}{a.size ? ` · ${formatSize(a.size)}` : ''}{serviceMode.mock ? ' (simulasi)' : ''}<DownloadButton attachment={a} /></li>)}</ul>}
          <FormField label="Nilai (0–100)" id="score" error={error}><input id="score" type="number" className="input" value={score} onChange={(e) => setScore(e.target.value)} /></FormField>
          <FormField label="Feedback" id="feedback"><textarea id="feedback" rows={3} className="input" value={feedback} onChange={(e) => setFeedback(e.target.value)} /></FormField>
        </div>
      </Modal>
      <ConfirmationDialog open={confirm} title="Ubah nilai?" message={`Nilai ${row.name} akan diubah dari ${s.score} menjadi ${score}.`} confirmLabel="Ya, ubah" onCancel={() => setConfirm(false)} onConfirm={save} />
    </>
  )
}

import { useState } from 'react'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/forms/FormField'

const URL_RE = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)\S+/
const empty = { title: '', classId: '', type: 'PG', questionCount: '', durationMin: '', dueAt: '', status: 'scheduled', formUrl: '' }

export default function QuizFormModal({ mode, classes, onClose, onSubmit }) {
  const google = mode === 'google'
  const [f, setF] = useState(empty)
  const [er, setEr] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = () => {
    const x = {}
    if (google && !URL_RE.test(f.formUrl.trim())) x.formUrl = 'Masukkan tautan Google Form yang valid (docs.google.com/forms/... atau forms.gle/...).'
    if (!f.title.trim()) x.title = 'Judul kuis wajib diisi.'
    if (!f.classId) x.classId = 'Pilih kelas sasaran.'
    if (!(Number(f.questionCount) >= 1 && Number(f.questionCount) <= 200)) x.questionCount = 'Jumlah soal 1–200.'
    if (!(Number(f.durationMin) >= 5 && Number(f.durationMin) <= 300)) x.durationMin = 'Durasi 5–300 menit.'
    if (!f.dueAt) x.dueAt = 'Batas waktu wajib diisi.'
    setEr(x)
    if (Object.keys(x).length) return
    onSubmit({ title: f.title.trim(), source: google ? 'google' : 'engine', status: f.status, classIds: [Number(f.classId)], questionCount: Number(f.questionCount), type: f.type, durationMin: Number(f.durationMin), dueAt: f.dueAt, formUrl: google ? f.formUrl.trim() : '' })
  }
  return (
    <Modal open title={google ? 'Tautkan Google Form Baru' : 'Buat Kuis Baru'} onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button className="btn-primary" onClick={submit}>{google ? 'Tautkan Form' : 'Buat Kuis'}</button></>}>
      <div className="space-y-3">
        {google && <FormField label="Tautan Google Form" id="qf-url" error={er.formUrl}><input id="qf-url" className="input" placeholder="https://docs.google.com/forms/..." value={f.formUrl} onChange={set('formUrl')} /></FormField>}
        <FormField label="Judul kuis" id="qf-title" error={er.title}><input id="qf-title" className="input" value={f.title} onChange={set('title')} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Kelas sasaran" id="qf-class" error={er.classId}><select id="qf-class" className="input" value={f.classId} onChange={set('classId')}><option value="">Pilih kelas</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
          <FormField label="Tipe soal" id="qf-type"><select id="qf-type" className="input" value={f.type} onChange={set('type')}><option>PG</option><option>PG & Esai</option></select></FormField>
          <FormField label="Jumlah soal" id="qf-count" error={er.questionCount}><input id="qf-count" type="number" className="input" value={f.questionCount} onChange={set('questionCount')} /></FormField>
          <FormField label="Durasi (menit)" id="qf-dur" error={er.durationMin}><input id="qf-dur" type="number" className="input" value={f.durationMin} onChange={set('durationMin')} /></FormField>
        </div>
        <FormField label="Batas waktu" id="qf-due" error={er.dueAt}><input id="qf-due" type="datetime-local" className="input" value={f.dueAt} onChange={set('dueAt')} /></FormField>
        <FormField label="Status awal" id="qf-status"><select id="qf-status" className="input" value={f.status} onChange={set('status')}><option value="scheduled">Terjadwal</option><option value="running">Berlangsung</option></select></FormField>
        {google && <p className="text-xs text-slate-500">Simulasi: tautan tidak diverifikasi ke Google.</p>}
      </div>
    </Modal>
  )
}

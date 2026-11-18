import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import FormField from '../../components/forms/FormField'
import AttachmentPicker from '../../components/forms/AttachmentPicker'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { teacherService, teacherAssignmentService as svc } from '../../services'

const empty = { title: '', instructions: '', classId: '', dueDate: '', attachments: [], status: 'draft' }

function Form({ initial, classes }) {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.title.trim()) er.title = 'Judul wajib diisi.'
    if (!f.instructions.trim()) er.instructions = 'Instruksi wajib diisi.'
    if (!f.classId) er.classId = 'Pilih kelas.'
    if (!f.dueDate) er.dueDate = 'Tenggat wajib diisi.'
    setErrors(er)
    if (Object.keys(er).length) return
    setSaving(true)
    try {
      await svc.save({ ...f, title: f.title.trim(), classId: Number(f.classId) })
      notify(initial.id ? 'Tugas diperbarui (simulasi).' : 'Tugas dibuat (simulasi).', 'success')
      navigate('/teacher/assignments/manage')
    } catch (err) { notify(err.message, 'error'); setSaving(false) }
  }
  return (
    <form onSubmit={submit} className="card max-w-3xl space-y-4 p-5" noValidate>
      <FormField label="Judul" id="title" error={errors.title}><input id="title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} /></FormField>
      <FormField label="Instruksi" id="instructions" error={errors.instructions}><textarea id="instructions" rows={6} className="input" value={f.instructions} onChange={(e) => set('instructions', e.target.value)} /></FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Kelas" id="classId" error={errors.classId}>
          <select id="classId" className="input" value={f.classId} onChange={(e) => set('classId', e.target.value)}><option value="">Pilih kelas</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </FormField>
        <FormField label="Tenggat waktu" id="dueDate" error={errors.dueDate}><input id="dueDate" type="datetime-local" className="input" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></FormField>
      </div>
      <div><p className="mb-1 text-sm font-medium">Lampiran</p><AttachmentPicker value={f.attachments} onChange={(v) => set('attachments', v)} /></div>
      <FormField label="Status" id="status"><select id="status" className="input" value={f.status} onChange={(e) => set('status', e.target.value)}><option value="draft">Draft</option><option value="published">Dipublikasikan</option><option value="archived">Diarsipkan</option></select></FormField>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => navigate('/teacher/assignments/manage')}>Batal</button>
        <button className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Simpan</button>
      </div>
    </form>
  )
}

export default function AssignmentFormPage() {
  const { id } = useParams()
  const load = useCallback(async () => ({ classes: await teacherService.classOptions(), item: id ? await svc.get(id) : empty }), [id])
  const { data, loading, error, reload } = useAsync(load)
  const title = id ? 'Edit tugas' : 'Buat tugas'
  return (
    <>
      <PageHeader title={title} breadcrumbs={[{ label: 'Beranda', to: '/teacher/dashboard' }, { label: 'Tugas', to: '/teacher/assignments' }, { label: title }]} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.item ? <ErrorState message="Tugas tidak ditemukan." /> : <Form initial={{ ...data.item, classId: data.item.classId ? String(data.item.classId) : '' }} classes={data.classes} />}
    </>
  )
}

import { useState } from 'react'
import { Modal } from '../common/Modal.jsx'
import { useToast } from '../common/Toast.jsx'
import SelectField from '../forms/SelectField.jsx'
import { scheduleMeta, validateEntry } from '../../services/classSchedules.js'
import { defaultTeacherByCourse } from '../../data/admin.js'

// Dipasang hanya saat dibuka (key per entri) sehingga state selalu segar.
export default function ScheduleFormModal({ initial, classId, all, onSave, onClose }) {
  const toast = useToast()
  const [v, setV] = useState({ day: initial?.day ?? '', start: initial?.start ?? '', end: initial?.end ?? '', courseId: initial?.courseId ?? '', teacherId: initial?.teacherId ?? '', room: initial?.room ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const pickCourse = (e) => setV({ ...v, courseId: e.target.value, teacherId: defaultTeacherByCourse[e.target.value] ?? v.teacherId })

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateEntry({ ...v, classId }, all, initial?.id)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try { await onSave({ ...v, classId }) } catch (err) {
      if (err.errors) setErrors(err.errors); else toast(err.message, 'error')
      setSaving(false)
    }
  }
  const timeCls = (bad) => `w-full rounded-lg border px-3 py-2 text-sm ${bad ? 'border-red-400' : 'border-slate-300'}`
  return (
    <Modal open title={initial ? 'Ubah jadwal' : 'Tambah jadwal'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <SelectField label="Hari" value={v.day} onChange={set('day')} error={errors.day} options={scheduleMeta.dayOptions} />
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">Jam mulai<input type="time" value={v.start} onChange={set('start')} className={timeCls(errors.time)} /></label>
          <label className="block text-sm font-medium text-slate-700">Jam selesai<input type="time" value={v.end} onChange={set('end')} className={timeCls(errors.time)} /></label>
        </div>
        {errors.time && <p className="-mt-2 text-xs text-red-600">{errors.time}</p>}
        <SelectField label="Mata pelajaran" value={v.courseId} onChange={pickCourse} error={errors.courseId} options={scheduleMeta.courses.map((c) => [c.id, c.name])} />
        <SelectField label="Guru pengajar" value={v.teacherId} onChange={set('teacherId')} error={errors.teacherId} options={scheduleMeta.teachers.map((t) => [t.id, t.name])} />
        <SelectField label="Ruang" value={v.room} onChange={set('room')} error={errors.room} options={scheduleMeta.rooms.map((r) => [r, r])} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Batal</button>
          <button disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  )
}

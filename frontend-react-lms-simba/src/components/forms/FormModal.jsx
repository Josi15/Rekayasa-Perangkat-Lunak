import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../common/Modal'
import FormField from './FormField'

// Modal formulir generik. fields: [{ name, label, type?: text|email|number|password|textarea|select, options?: [{value,label}], required?, hint?, readOnly? }]
// onSubmit(values) boleh melempar Error → pesannya tampil di atas formulir (validasi inti ada di service).
export default function FormModal({ open, title, fields, initial = {}, submitLabel = 'Simpan', onSubmit, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? ''])))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    fields.forEach((f) => { if (f.required && !String(values[f.name] ?? '').trim()) next[f.name] = `${f.label} wajib diisi.` })
    setErrors(next); setServerError('')
    if (Object.keys(next).length) return
    setSaving(true)
    try { await onSubmit(values) } catch (err) { setServerError(err.message) } finally { setSaving(false) }
  }

  const control = (f) => {
    const id = `fm-${f.name}`
    if (f.type === 'textarea') return <textarea id={id} rows={4} className="input" value={values[f.name]} onChange={set(f.name)} />
    if (f.type === 'select') return (
      <select id={id} className="input" value={values[f.name]} onChange={set(f.name)}>
        <option value="">Pilih…</option>
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
    return <input id={id} type={f.type ?? 'text'} className="input" value={values[f.name]} onChange={set(f.name)} readOnly={f.readOnly} autoComplete={f.type === 'password' ? 'new-password' : 'off'} />
  }

  return (
    <Modal open={open} title={title} onClose={onClose}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" form="form-modal" className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} {submitLabel}</button>
      </>}>
      <form id="form-modal" onSubmit={submit} noValidate className="space-y-3">
        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
        {fields.map((f) => (
          <FormField key={f.name} label={f.label} id={`fm-${f.name}`} error={errors[f.name]}>
            {control(f)}
            {f.hint && <p className="text-xs text-slate-500">{f.hint}</p>}
          </FormField>
        ))}
      </form>
    </Modal>
  )
}

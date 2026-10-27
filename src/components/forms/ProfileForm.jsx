import { useState } from 'react'
import TextField from './TextField.jsx'
import TextArea from './TextArea.jsx'
import { useToast } from '../common/Toast.jsx'
import { studentProfile, validateProfile } from '../../services/studentProfile.js'

export default function ProfileForm({ uid, profile, onSaved }) {
  const toast = useToast()
  const [v, setV] = useState({ name: profile.name, email: profile.email, phone: profile.phone ?? '', address: profile.address ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateProfile(v)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try { onSaved(await studentProfile.update(uid, v)); toast('Profil berhasil diperbarui.') } catch (err) { toast(err.message, 'error') } finally { setSaving(false) }
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField label="Nama lengkap" value={v.name} onChange={set('name')} error={errors.name} />
      <TextField label="Email" type="email" value={v.email} onChange={set('email')} error={errors.email} />
      <TextField label="Nomor telepon" value={v.phone} onChange={set('phone')} error={errors.phone} />
      <TextArea label="Alamat" rows={3} value={v.address} onChange={set('address')} error={errors.address} hint={`${v.address.length}/200`} />
      <button disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan perubahan'}</button>
    </form>
  )
}

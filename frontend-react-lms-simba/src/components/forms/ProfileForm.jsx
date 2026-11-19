import { useState } from 'react'
import { Lock } from 'lucide-react'
import TextField from './TextField.jsx'
import TextArea from './TextArea.jsx'
import { useToast } from '../common/Toast.jsx'
import { studentProfile, validateProfile } from '../../services/studentProfile.js'
import { btnPrimary } from '../../utils/styles.js'

function ReadOnly({ label, value }) {
  return <div><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span><p className="flex items-center justify-between rounded-lg bg-simba-bg px-3 py-2 text-sm text-slate-700">{value}<Lock className="size-3.5 text-slate-400" /></p></div>
}

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
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nama lengkap siswa" value={v.name} onChange={set('name')} error={errors.name} />
        <ReadOnly label="Nomor induk siswa (NIS / NISN)" value={`${profile.nis} / ${profile.nisn}`} />
        <ReadOnly label="Tempat & tanggal lahir" value={profile.birthInfo} />
        <ReadOnly label="Jenis kelamin" value={profile.gender} />
        <ReadOnly label="Agama" value={profile.religion} />
        <TextField label="Nomor WhatsApp / HP aktif" value={v.phone} onChange={set('phone')} error={errors.phone} />
      </div>
      <ReadOnly label="Email institusi resmi" value={profile.email} />
      <TextArea label="Alamat domisili tetap" rows={3} value={v.address} onChange={set('address')} error={errors.address} hint={`${v.address.length}/200`} />
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Data bertanda gembok dikelola sekolah dan tidak dapat diubah dari sini.</p><button disabled={saving} className={btnPrimary}>{saving ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}</button></div>
    </form>
  )
}

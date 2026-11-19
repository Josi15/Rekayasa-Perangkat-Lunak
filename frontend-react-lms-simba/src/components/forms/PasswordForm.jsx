import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import TextField from './TextField.jsx'
import { ConfirmationDialog } from '../common/Modal.jsx'
import { useToast } from '../common/Toast.jsx'
import { studentProfile, validatePassword } from '../../services/studentProfile.js'

const empty = { current: '', next: '', confirm: '' }

export default function PasswordForm() {
  const toast = useToast()
  const [v, setV] = useState(empty)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const eye = <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{show ? <EyeOff className="size-4 text-slate-500" /> : <Eye className="size-4 text-slate-500" />}</button>
  const type = show ? 'text' : 'password'

  const review = (e) => {
    e.preventDefault()
    const errs = validatePassword(v)
    setErrors(errs)
    if (Object.keys(errs).length === 0) setConfirm(true)
  }
  const apply = async () => {
    await studentProfile.changePasswordSimulated(v)
    setConfirm(false); setV(empty)
    toast('Simulasi selesai: kata sandi tidak benar-benar diubah.')
  }
  return (
    <form onSubmit={review} noValidate className="space-y-4">
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Antarmuka simulasi. Kata sandi belum diubah di server karena backend belum tersedia.</p>
      <TextField label="Kata sandi saat ini" type={type} value={v.current} onChange={set('current')} error={errors.current} right={eye} autoComplete="current-password" />
      <TextField label="Kata sandi baru" type={type} value={v.next} onChange={set('next')} error={errors.next} autoComplete="new-password" />
      <TextField label="Konfirmasi kata sandi baru" type={type} value={v.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
      <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Ubah kata sandi</button>
      <ConfirmationDialog open={confirm} tone="primary" title="Ubah kata sandi?" message="Ini hanya simulasi dan tidak mengubah kata sandi akun." confirmLabel="Ya, lanjutkan" onConfirm={apply} onCancel={() => setConfirm(false)} />
    </form>
  )
}

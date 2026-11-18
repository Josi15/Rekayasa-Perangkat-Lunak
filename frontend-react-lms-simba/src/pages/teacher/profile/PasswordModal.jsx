import { useState } from 'react'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/forms/FormField'
import { useToast } from '../../../contexts/ToastContext'
import { profileService } from '../../../services'

export default function PasswordModal({ onClose }) {
  const { notify } = useToast()
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [er, setEr] = useState({})
  const submit = async () => {
    const x = {}
    if (!f.current) x.current = 'Kata sandi saat ini wajib diisi.'
    if (f.next.length < 10) x.next = 'Kata sandi baru minimal 10 karakter.'
    else if (!/[a-z]/.test(f.next) || !/[A-Z]/.test(f.next) || !/\d/.test(f.next)) x.next = 'Kata sandi baru harus memuat huruf besar, huruf kecil, dan angka.'
    if (f.confirm !== f.next) x.confirm = 'Konfirmasi tidak sama.'
    setEr(x)
    if (Object.keys(x).length) return
    try { const r = await profileService.changePassword(f); notify(r?.simulated === false ? 'Kata sandi berhasil diubah.' : 'Simulasi: validasi berhasil, kata sandi TIDAK diubah di server.', r?.simulated === false ? 'success' : 'info'); onClose() }
    catch (e) { setEr({ current: e.message }) }
  }
  const field = (k, label) => <FormField label={label} id={`pw-${k}`} error={er[k]}><input id={`pw-${k}`} type="password" className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></FormField>
  return (
    <Modal open title="Ubah Kata Sandi (simulasi)" onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button className="btn-primary" onClick={submit}>Simpan kata sandi</button></>}>
      <div className="space-y-3">{field('current', 'Kata sandi saat ini')}{field('next', 'Kata sandi baru')}{field('confirm', 'Konfirmasi kata sandi baru')}</div>
    </Modal>
  )
}

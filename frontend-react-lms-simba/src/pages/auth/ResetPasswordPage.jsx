import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import FormField from '../../components/forms/FormField'
import { authService, serviceMode } from '../../services'

// Tujuan tautan di email reset (FRONTEND_URL/reset-password?token=…&email=…). Hanya bermakna saat backend terhubung.
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? '', email = params.get('email') ?? ''
  const [state, setState] = useState(serviceMode.mock ? 'mock' : !token || !email ? 'invalid' : 'checking') // checking | ready | invalid | done | mock
  const [f, setF] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (serviceMode.mock || !token || !email) return
    authService.validateResetToken({ email, token }).then(() => setState('ready')).catch(() => setState('invalid'))
  }, [token, email])

  const submit = async (ev) => {
    ev.preventDefault()
    if (f.password !== f.confirm) return setError('Konfirmasi kata sandi tidak sama.')
    setError(''); setLoading(true)
    try { await authService.resetPassword({ email, token, ...f }); setState('done') } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  const set = (k) => (ev) => setF((x) => ({ ...x, [k]: ev.target.value }))

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Atur ulang kata sandi</h1></div>
      {state === 'mock' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Mode simulasi: fitur ini aktif setelah backend terhubung.</p>}
      {state === 'checking' && <p className="text-sm text-slate-500">Memeriksa tautan…</p>}
      {state === 'invalid' && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.</p>}
      {state === 'done' && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.</p>}
      {state === 'ready' && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <FormField label="Kata sandi baru" id="rp-password"><input id="rp-password" type="password" className="input" autoComplete="new-password" value={f.password} onChange={set('password')} /></FormField>
          <FormField label="Konfirmasi kata sandi baru" id="rp-confirm"><input id="rp-confirm" type="password" className="input" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></FormField>
          <button className="btn-primary w-full" disabled={loading}>{loading && <Loader2 size={16} className="animate-spin" />} Simpan kata sandi</button>
        </form>
      )}
      <Link to="/login" className="block text-center text-sm text-brand-600 hover:underline">Kembali ke halaman masuk</Link>
    </div>
  )
}

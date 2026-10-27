import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import TextField from '../../components/forms/TextField.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={`/${user.role}`} replace />

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.identifier.trim()) errs.identifier = 'Email atau username wajib diisi.'
    if (form.password.length < 6) errs.password = 'Kata sandi minimal 6 karakter.'
    setErrors(errs)
    setSubmitError('')
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      const u = await login(form.identifier, form.password)
      navigate(`/${u.role}`, { replace: true })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <h1 className="text-center text-lg font-semibold text-slate-800">Masuk ke akun Anda</h1>
      {submitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</p>}
      <TextField label="Email atau username" value={form.identifier} error={errors.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} autoComplete="username" />
      <TextField label="Kata sandi" type={show ? 'text' : 'password'} value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password"
        right={<button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{show ? <EyeOff className="size-4 text-slate-500" /> : <Eye className="size-4 text-slate-500" />}</button>} />
      <div className="text-right text-sm"><Link to="/forgot-password" className="text-brand-600 hover:underline">Lupa kata sandi?</Link></div>
      <button disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{loading ? 'Memproses...' : 'Masuk'}</button>
      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Mode simulasi. Akun demo: <b>siswa</b>, <b>guru</b>, atau <b>admin</b> dengan kata sandi <b>password123</b>.</p>
    </form>
  )
}

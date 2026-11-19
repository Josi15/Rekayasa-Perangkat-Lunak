import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, UserRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

const ROLES = [['student', 'Siswa'], ['teacher', 'Guru'], ['admin', 'Admin']]
// Akun demo (mock) diisi otomatis seperti pada desain Figma. Hapus saat produksi.
const DEMO = { student: { identifier: '0064829104', password: 'Teladan2025!' }, teacher: { identifier: 'guru', password: 'password123' }, admin: { identifier: 'admin', password: 'password123' } }

function Field({ label, icon: Icon, error, right, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#0f1b3d]">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
        <input {...props} className={`w-full rounded-xl border bg-[#eef2fb] py-3.5 pl-12 pr-12 text-base outline-none focus:ring-2 focus:ring-brand-100 ${error ? 'border-red-400' : 'border-transparent focus:border-brand-500'}`} />
        {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [form, setForm] = useState(DEMO.student)
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={`/${user.role}`} replace />
  const isStudent = role === 'student'

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.identifier.trim()) errs.identifier = isStudent ? 'NISN wajib diisi.' : 'Email atau username wajib diisi.'
    else if (isStudent && !/^\d{10}$/.test(form.identifier.trim()) && form.identifier.trim().length < 3) errs.identifier = 'NISN terdiri dari 10 digit angka.'
    if (form.password.length < 6) errs.password = 'Kata sandi minimal 6 karakter.'
    setErrors(errs)
    setSubmitError('')
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      const u = await login(form.identifier, form.password, { remember, role })
      navigate(`/${u.role}`, { replace: true })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <h2 className="text-3xl font-extrabold text-[#0f1b3d] lg:text-4xl">Masuk ke Akun Anda</h2>
        <p className="mt-2 text-slate-600">Silakan pilih peran dan masukkan kredensial resmi sekolah.</p>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
        {ROLES.map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={role === v} onClick={() => { setRole(v); setForm(DEMO[v]); setErrors({}); setSubmitError('') }}
            className={`rounded-lg py-2 text-sm font-semibold ${role === v ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>
      {submitError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</p>}
      <Field label={isStudent ? 'Nomor Induk Siswa Nasional (NISN)' : 'Email atau username'} icon={UserRound} value={form.identifier} error={errors.identifier}
        onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder={isStudent ? 'Masukkan 10 digit NISN' : 'Email atau username'} autoComplete="username" />
      <Field label="Kata sandi" icon={Lock} type={show ? 'text' : 'password'} value={form.password} error={errors.password} autoComplete="current-password"
        onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Masukkan kata sandi"
        right={<button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{show ? <EyeOff className="size-5 text-slate-500" /> : <Eye className="size-5 text-slate-500" />}</button>} />
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-simba-lime" />Ingat sesi saya</label>
        <Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">Lupa kata sandi?</Link>
      </div>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d7a12] py-3.5 font-semibold text-white hover:bg-[#256610] disabled:opacity-60">{loading ? 'Memproses...' : <>Masuk ke SIMBA <ArrowRight className="size-5" /></>}</button>
      <p className="rounded-xl bg-simba-bg p-3 text-xs text-slate-600">Mode simulasi. Siswa: NISN <b>0064829104</b>, kata sandi <b>Teladan2025!</b>. Guru/Admin: username <b>guru</b> atau <b>admin</b>, kata sandi <b>password123</b>.</p>
    </form>
  )
}

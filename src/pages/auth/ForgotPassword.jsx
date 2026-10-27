import { useState } from 'react'
import { Link } from 'react-router-dom'
import TextField from '../../components/forms/TextField.jsx'
import { authService } from '../../services/index.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Masukkan alamat email yang valid.')
    setError('')
    setLoading(true)
    await authService.requestPasswordReset(email)
    setLoading(false)
    setDone(true)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-center text-lg font-semibold text-slate-800">Lupa kata sandi</h1>
      {done ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Permintaan tercatat pada mode simulasi. Belum ada email yang dikirim dan kata sandi belum diubah; fitur ini aktif setelah backend terhubung.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Email terdaftar" type="email" value={email} error={error} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{loading ? 'Memproses...' : 'Kirim permintaan reset'}</button>
        </form>
      )}
      <p className="text-center text-sm"><Link to="/login" className="text-brand-600 hover:underline">Kembali ke login</Link></p>
    </div>
  )
}

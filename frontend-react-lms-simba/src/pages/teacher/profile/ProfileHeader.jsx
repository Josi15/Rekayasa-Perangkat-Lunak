import { useRef, useState } from 'react'
import { Camera, Printer, Save } from 'lucide-react'
import { teacherHome } from '../../../data/teacherHome'

const OK = ['image/png', 'image/jpeg', 'image/webp']

export default function ProfileHeader({ p, onPhoto }) {
  const input = useRef(null)
  const [err, setErr] = useState('')
  const pick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!OK.includes(f.type)) return setErr('Foto harus PNG, JPG, atau WEBP.')
    if (f.size > 2 * 1024 * 1024) return setErr('Ukuran foto maksimal 2 MB.')
    setErr('')
    const r = new FileReader()
    r.onload = () => onPhoto(r.result)
    r.readAsDataURL(f)
  }
  const [yr, sem] = teacherHome.academicYear.split(' ')
  return (
    <section className="panel relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-200/60 blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-6">
        <div className="relative">
          {p.photo ? <img src={p.photo} alt="Foto profil" className="h-28 w-28 rounded-full object-cover ring-4 ring-brand-100" /> : <span className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-200 text-4xl font-extrabold text-brand-700 ring-4 ring-brand-100">{p.name[0]}</span>}
          <input ref={input} type="file" hidden aria-label="Ubah foto profil" onChange={pick} />
          <button type="button" aria-label="Ganti foto" onClick={() => input.current.click()} className="absolute bottom-0 right-0 rounded-full bg-brand-600 p-2 text-white hover:bg-brand-700"><Camera size={14} /></button>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="text-2xl font-extrabold sm:text-4xl">{p.name}</h1>
          <span className="inline-flex rounded-full bg-brand-200 px-3 py-0.5 text-xs font-semibold text-brand-700">Data Dapodik (simulasi)</span>
          <p className="text-brand-700"><b>Guru Tetap {teacherHome.subject}</b> <span className="text-slate-500">• Wali Kelas {teacherHome.homeroom.name}</span></p>
          <p className="text-sm text-slate-600">Koordinator Lab Komputer SMAN 1 Teladan</p>
          <p className="flex flex-wrap gap-x-5 text-xs text-slate-600"><span>NIP: <b className="font-mono text-slate-900">{p.nip}</b></span><span>NUPTK: <b className="font-mono text-slate-900">{p.nuptk}</b></span></p>
          <p className="text-xs text-brand-700">● Pendidik Aktif ({sem} {yr})</p>
          {err && <p role="alert" className="text-xs text-red-600">{err}</p>}
        </div>
        <div className="flex gap-3 print:hidden">
          <button type="button" className="btn-secondary !bg-slate-100" onClick={() => window.print()}><Printer size={14} /> Cetak Lembar PTK</button>
          <button type="submit" form="profile-form" className="btn-primary"><Save size={14} /> Simpan Perubahan</button>
        </div>
      </div>
    </section>
  )
}

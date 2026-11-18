import { useState } from 'react'
import { Fingerprint, FlaskConical, Mail, Phone, MapPin, IdCard, Hash, Loader2, CheckCircle2 } from 'lucide-react'

const PHONE = /^(\+62|62|0)8\d{7,11}$/
const EMAIL = /^\S+@\S+\.\S+$/
const ro = 'w-full rounded-lg bg-brand-50 py-3 pl-10 pr-3 text-sm text-slate-700'

function Field({ id, label, hint, error, icon: I, children, tag }) {
  return (
    <div className="space-y-1.5"><div className="flex justify-between text-xs"><label htmlFor={id} className="font-semibold text-slate-800">{label}</label>{tag && <span className="text-slate-500">{tag}</span>}</div>
      <div className="relative"><I size={16} className="absolute left-3 top-3.5 text-slate-500" />{children}</div>
      {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : hint && <p className="text-xs text-slate-500">{hint}</p>}</div>
  )
}

export default function BiodataForm({ p, onSave }) {
  const [f, setF] = useState({ name: p.name, email: p.email, phone: p.phone, address: p.address })
  const [er, setEr] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const mins = p.updatedAt ? Math.floor((Date.now() - p.updatedAt) / 60000) : null
  const submit = async (e) => {
    e.preventDefault()
    const x = {}
    if (f.name.trim().length < 3) x.name = 'Nama lengkap wajib diisi (min. 3 karakter).'
    if (!EMAIL.test(f.email)) x.email = 'Email tidak valid.'
    if (!PHONE.test(f.phone.replace(/[\s-]/g, ''))) x.phone = 'Nomor WhatsApp tidak valid (contoh: +62 812-9843-2210).'
    if (f.address.length > 200) x.address = 'Alamat maksimal 200 karakter.'
    setEr(x)
    if (Object.keys(x).length) return
    setSaving(true); await onSave(f); setSaving(false)
  }
  const input = 'w-full rounded-lg bg-brand-50 py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-200'
  return (
    <form id="profile-form" onSubmit={submit} noValidate className="panel space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold">Formulir Data Pokok Guru</h2><p className="max-w-md text-xs text-slate-600">Data simulasi; belum tersinkron dengan Master Data Dapodik Kemendikbudristek.</p></div>
        <span className="rounded-lg bg-brand-100 px-3 py-2 text-xs text-brand-700">Terakhir diperbarui: {mins == null ? 'belum ada perubahan' : mins < 1 ? 'baru saja' : `${mins} menit lalu`}</span></div>
      <Field id="pname" label="Nama Lengkap & Gelar Resmi" tag="Sesuai Ijazah Terakhir" icon={IdCard} error={er.name}><input id="pname" className={input} value={f.name} onChange={set('name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pnip" label="Nomor Induk Pegawai (NIP)" hint="Kunci identitas ASN permanen" icon={Hash}><input id="pnip" className={`${ro} font-mono`} value={p.nip} disabled /></Field>
        <Field id="pnuptk" label="NUPTK Nasional" hint="Kementerian Pendidikan" icon={Fingerprint}><input id="pnuptk" className={`${ro} font-mono`} value={p.nuptk} disabled /></Field>
      </div>
      <Field id="psubject" label="Mata Pelajaran Diampu" icon={FlaskConical}><input id="psubject" className={ro} value={p.subject} disabled /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pemail" label="Email Resmi Sekolah" hint="Belum terhubung Google Workspace (simulasi)" icon={Mail} error={er.email}><input id="pemail" type="email" className={input} value={f.email} onChange={set('email')} /></Field>
        <Field id="pphone" label="Nomor WhatsApp Aktif" hint="Untuk notifikasi presensi siswa & KBM" icon={Phone} error={er.phone}><input id="pphone" className={input} value={f.phone} onChange={set('phone')} /></Field>
      </div>
      <Field id="paddress" label="Alamat Domisili Lengkap" icon={MapPin} error={er.address}><textarea id="paddress" rows={2} className={input} value={f.address} onChange={set('address')} /></Field>
      <div className="flex justify-end"><button className="btn-primary" disabled={saving}>{saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Perbarui Data Profil</button></div>
    </form>
  )
}

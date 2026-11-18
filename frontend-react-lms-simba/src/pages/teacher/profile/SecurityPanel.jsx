import { useState } from 'react'
import { ShieldCheck, Laptop, KeyRound, LogOut, Smartphone } from 'lucide-react'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog'
import PasswordModal from './PasswordModal'
import { describeDevice } from '../../../utils/device'

export default function SecurityPanel({ p, onTwoFA, onSignOutOthers }) {
  const [confirm2fa, setConfirm2fa] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [pw, setPw] = useState(false)
  return (
    <section id="keamanan" className="panel space-y-4">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-brand-100 p-2.5 text-brand-700"><ShieldCheck size={18} /></span><div><h2 className="font-bold">Keamanan Akun & Akses</h2><p className="text-xs text-slate-600">Proteksi autentikasi SSO & sesi login</p></div></div>
      <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4"><div><p className="text-sm font-semibold">Autentikasi Dua Langkah (2FA)</p><p className="text-xs text-slate-600">{p.twoFA ? 'Aktif via Google Authenticator' : 'Nonaktif'}</p></div>
        <button role="switch" aria-checked={p.twoFA} aria-label="Autentikasi Dua Langkah (2FA)" onClick={() => (p.twoFA ? setConfirm2fa(true) : onTwoFA(true))} className={`relative h-7 w-12 rounded-full transition ${p.twoFA ? 'bg-brand-600' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${p.twoFA ? 'left-[22px]' : 'left-0.5'}`} /></button></div>
      <div className="space-y-3 rounded-xl bg-brand-50 p-4">
        <div className="flex items-center justify-between text-xs"><b className="uppercase tracking-wide text-slate-600">Sesi Perangkat Aktif</b><b className="text-brand-700">● Saat Ini Aktif</b></div>
        <div className="flex items-center gap-3"><span className="rounded-lg bg-white p-2"><Laptop size={18} /></span><div><p className="text-sm font-bold">{describeDevice(navigator.userAgent)}</p><p className="text-xs text-slate-500">Sesi ini</p></div></div>
        {p.otherSessions.map((s) => <div key={s.id} className="flex items-center gap-3"><span className="rounded-lg bg-white p-2"><Smartphone size={18} /></span><div><p className="text-sm font-bold">{s.device}</p><p className="text-xs text-slate-500">{s.location} • {s.lastActive}</p></div></div>)}
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn-secondary !bg-slate-100" onClick={() => setPw(true)}><KeyRound size={14} /> Ubah Kata Sandi</button>
        <button className="btn !bg-red-50 !text-red-700 hover:!bg-red-100" disabled={p.otherSessions.length === 0} onClick={() => setConfirmOut(true)}><LogOut size={14} /> Keluar Sesi Lain</button>
      </div>
      {pw && <PasswordModal onClose={() => setPw(false)} />}
      <ConfirmationDialog open={confirm2fa} title="Nonaktifkan 2FA?" message="Akun Anda akan kurang terlindungi tanpa autentikasi dua langkah." confirmLabel="Ya, nonaktifkan" onCancel={() => setConfirm2fa(false)} onConfirm={() => { setConfirm2fa(false); onTwoFA(false) }} />
      <ConfirmationDialog open={confirmOut} title="Keluar dari sesi lain?" message="Semua perangkat lain akan keluar dari akun ini." confirmLabel="Ya, keluar" onCancel={() => setConfirmOut(false)} onConfirm={() => { setConfirmOut(false); onSignOutOthers() }} />
    </section>
  )
}

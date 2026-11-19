import { useCallback, useState } from 'react'
import { Download, GraduationCap } from 'lucide-react'
import { Card, Pill } from '../../components/student/ui.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import ProfileForm from '../../components/forms/ProfileForm.jsx'
import PasswordForm from '../../components/forms/PasswordForm.jsx'
import Logo from '../../components/common/Logo.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentProfile } from '../../services/index.js'
import { btnGhost } from '../../utils/styles.js'

export default function Profile() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentProfile.get(user.id), [user.id]))
  return <AsyncBoundary state={state}>{(p) => <Content initial={p} />}</AsyncBoundary>
}

function Content({ initial }) {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(initial)
  const [tab, setTab] = useState('profile')
  const [cardOpen, setCardOpen] = useState(false)
  const saved = (p) => { setProfile(p); updateUser({ name: p.name, email: p.email }) }
  const rows = [['Tahun Masuk', profile.entryYear], ['Kurikulum', profile.curriculum], ['Peminatan', profile.major], ['IPK Kumulatif (Sem 1-5)', `${profile.gpa} / 100`]]

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-20 place-items-center rounded-2xl bg-simba-dark text-3xl font-bold text-white" aria-label="Foto profil (placeholder)">{profile.name[0]}</span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap gap-2"><Pill>Siswa Aktif</Pill><Pill tone="slate">Ketua Kelas {profile.className}</Pill></p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{profile.name}</h1>
            <p className="text-xs text-slate-500">NISN: {profile.nisn} · Kelas {profile.className} · {profile.school}</p>
          </div>
          <button onClick={() => setCardOpen(true)} className={btnGhost}><Download className="size-4" />Unduh Kartu Pelajar</button>
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex gap-2 border-b border-simba-line" role="tablist">
            {[['profile', 'Biodata Diri'], ['password', 'Ubah Kata Sandi']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}>{l}</button>)}
          </div>
          {tab === 'profile' ? <ProfileForm uid={user.id} profile={profile} onSaved={saved} /> : <PasswordForm />}
        </Card>
        <Card title="Tahun Akademik" icon={GraduationCap}>
          <div className="rounded-xl bg-simba-bg p-3 text-sm"><p className="text-xs text-slate-500">Wali Kelas {profile.className}</p><b className="text-slate-900">Ibu {profile.homeroom}</b><p className="text-xs text-slate-500">NIP. {profile.homeroomNip}</p></div>
          <dl className="mt-3 divide-y divide-simba-line text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between py-2"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-slate-900">{v}</dd></div>)}</dl>
          <p className="mt-3 rounded-xl bg-brand-50 p-3 text-2xl font-extrabold text-brand-700">{profile.cumulativeAttendance}<span className="block text-xs font-medium text-slate-500">Kehadiran kumulatif</span></p>
        </Card>
      </div>
      <Modal open={cardOpen} title="Kartu Pelajar" onClose={() => setCardOpen(false)}>
        <div className="rounded-2xl bg-simba-dark p-4 text-white"><div className="flex items-center gap-3"><Logo className="size-10" /><div><b>SMAN 1 Teladan</b><p className="text-xs text-white/70">Kartu Pelajar Digital</p></div></div>
          <p className="mt-4 text-lg font-bold">{profile.name}</p><p className="text-sm text-white/80">NISN {profile.nisn} · NIS {profile.nis}</p><p className="text-sm text-white/80">Kelas {profile.className}</p></div>
        <div className="no-print mt-4 flex justify-end"><button onClick={() => window.print()} className={btnGhost}>Cetak / Simpan PDF</button></div>
      </Modal>
    </div>
  )
}

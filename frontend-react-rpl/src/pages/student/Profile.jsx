import { useCallback, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ProfileForm from '../../components/forms/ProfileForm.jsx'
import PasswordForm from '../../components/forms/PasswordForm.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentProfile } from '../../services/index.js'

export default function Profile() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentProfile.get(user.id), [user.id]))
  return (
    <>
      <PageHeader title="Profil Saya" breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Profil' }]} />
      <AsyncBoundary state={state}>{(p) => <Content initial={p} />}</AsyncBoundary>
    </>
  )
}

function Content({ initial }) {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(initial)
  const [tab, setTab] = useState('profile')
  const saved = (p) => { setProfile(p); updateUser({ name: p.name, email: p.email }) }
  const info = [['Nama', profile.name], ['Email', profile.email], ['Nomor induk (NIS)', profile.nis], ['Kelas', profile.className], ['Telepon', profile.phone || '-'], ['Alamat', profile.address || '-']]
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="grid size-24 place-items-center rounded-full bg-brand-600 text-4xl font-bold text-white" aria-label="Foto profil (placeholder)">{profile.name[0]}</div>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">{profile.name}</h2><p className="text-sm text-slate-500">Siswa · {profile.className}</p>
        </div>
        <dl className="mt-5 space-y-3 text-sm">{info.map(([k, val]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="text-slate-800">{val}</dd></div>)}</dl>
        <p className="mt-4 text-xs text-slate-400">NIS dan kelas dikelola oleh admin sekolah. ID akun: {user.id}</p>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-4 flex gap-2 border-b border-slate-200" role="tablist">
          {[['profile', 'Edit profil'], ['password', 'Ubah kata sandi']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}>{l}</button>
          ))}
        </div>
        {tab === 'profile' ? <ProfileForm uid={user.id} profile={profile} onSaved={saved} /> : <PasswordForm />}
      </section>
    </div>
  )
}

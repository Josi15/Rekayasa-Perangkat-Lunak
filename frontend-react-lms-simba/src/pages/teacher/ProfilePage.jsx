import { useCallback, useEffect, useState } from 'react'
import { User, ClipboardCheck, ShieldCheck, GraduationCap } from 'lucide-react'
import TopBar from '../../components/layout/TopBar'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import ProfileHeader from './profile/ProfileHeader'
import BiodataForm from './profile/BiodataForm'
import SkPanel from './profile/SkPanel'
import SecurityPanel from './profile/SecurityPanel'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { profileService as svc, teacherScheduleService, attendanceService } from '../../services'
import { teacherHome } from '../../data/teacherHome'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { notify } = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('biodata')
  const refresh = useCallback(() => Promise.all([svc.get(), teacherScheduleService.get(), attendanceService.get()])
    .then(([profile, sched, att]) => setData({ profile, jp: sched.jp, standard: sched.standardJp, total: att.stats.total })).catch((e) => setError(e.message)), [])
  useEffect(() => { refresh() }, [refresh])

  const act = async (fn, msg) => { try { await fn(); await refresh(); if (msg) notify(msg, 'success') } catch (e) { notify(e.message, 'error') } }
  const go = (id) => { setTab(id); document.getElementById(id === 'biodata' ? 'profile-form' : id)?.scrollIntoView?.({ behavior: 'smooth' }) }
  const [yr, sem] = teacherHome.academicYear.split(' ')
  const tabs = data && [['biodata', 'Biodata Pendidik', User], ['sk', `Tugas Mengajar & SK`, ClipboardCheck, `${data.jp} JP`], ['keamanan', 'Keamanan Akun & Sandi', ShieldCheck]]

  return (
    <div>
      <TopBar query="" onQuery={() => {}} placeholder="Cari" name={user.name} subtitle={`Guru ${teacherHome.subject} & Wali Kelas ${teacherHome.homeroom.name}`} />
      {error ? <ErrorState message={error} onRetry={refresh} /> : !data ? <LoadingState /> : (
        <div className="space-y-6">
          <ProfileHeader p={data.profile} onPhoto={(url) => act(() => svc.setPhoto(url), 'Foto profil diperbarui (hanya di memori, tidak diunggah ke server).')} />
          <nav aria-label="Bagian profil" className="flex flex-wrap gap-2 rounded-2xl bg-brand-50 p-2 print:hidden">
            {tabs.map(([k, l, I, badge]) => <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === k ? 'bg-white text-brand-700 shadow-card' : 'text-slate-700 hover:bg-white/70'}`}><I size={15} />{l}{badge && <span className="rounded-full bg-brand-200 px-2 py-0.5 text-[11px] font-bold text-brand-700">{badge}</span>}</button>)}
          </nav>
          <div className="grid items-start gap-6 xl:grid-cols-[1fr_400px]">
            <BiodataForm key={data.profile.updatedAt ?? 0} p={data.profile} onSave={async (f) => { try { await svc.update(f); updateUser({ name: f.name.trim() }); await refresh(); notify('Profil diperbarui (hanya di memori sesi ini).', 'success') } catch (e) { notify(e.message, 'error') } }} />
            <div className="space-y-6">
              <SkPanel jp={data.jp} standard={data.standard} homeroom={{ name: teacherHome.homeroom.name, total: data.total }} semester={`${sem} TA ${yr}`} />
              <SecurityPanel p={data.profile} onTwoFA={(on) => act(() => svc.setTwoFA(on), on ? '2FA diaktifkan (simulasi).' : '2FA dinonaktifkan (simulasi).')} onSignOutOthers={() => act(() => svc.signOutOthers(), 'Sesi lain dikeluarkan (simulasi).')} />
              <p className="flex gap-3 rounded-2xl bg-brand-50 p-4 text-xs text-slate-700"><GraduationCap size={18} className="shrink-0 text-brand-700" />Akun ini direncanakan terikat pada server SIMBA LMS & Dapodik SMAN 1 Teladan. Pemutakhiran status NIP/Pangkat memerlukan verifikasi Operator Sekolah (TU). Pada versi simulasi ini belum ada koneksi ke server.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

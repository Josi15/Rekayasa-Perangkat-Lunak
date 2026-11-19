import { Outlet } from 'react-router-dom'
import { BookCheck, ClipboardCheck, UserCheck } from 'lucide-react'
import Logo from '../components/common/Logo.jsx'

export default function AuthLayout() {
  return (
    <div className="theme-simba min-h-screen bg-[#f8fafd] p-4 font-sans lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl gap-6 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2">
        <aside className="flex flex-col rounded-3xl bg-gradient-to-br from-[#2b6a16] to-[#1d5410] p-8 text-white lg:p-12">
          <div className="flex items-center gap-4">
            <Logo className="size-24 lg:size-28" rounded="rounded-3xl" />
            <div><span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold tracking-widest">E-LEARNING</span><p className="mt-1 text-lg font-bold">SMAN 1 Teladan</p></div>
          </div>
          <h1 className="mt-10 text-4xl font-extrabold lg:mt-16 lg:text-5xl">SIMBA LMS</h1>
          <p className="mt-2 text-xl font-bold text-simba-lime lg:text-2xl">Sistem Informasi Manajemen Belajar Aktif</p>
          <p className="mt-4 max-w-md leading-relaxed text-white/80">Satu portal terpadu untuk kemudahan presensi, asesmen digital (CBT), dan pemantauan rapor berkala civitas SMAN 1 Teladan.</p>
          <div className="mt-auto hidden border-t border-white/20 pt-6 lg:block">
            <ul className="flex gap-6 text-sm text-white/80">
              <li className="flex items-center gap-2"><UserCheck className="size-4 text-simba-lime" />Presensi</li>
              <li className="flex items-center gap-2"><ClipboardCheck className="size-4 text-simba-lime" />Asesmen CBT</li>
              <li className="flex items-center gap-2"><BookCheck className="size-4 text-simba-lime" />Rapor</li>
            </ul>
          </div>
        </aside>
        <main className="flex items-center rounded-3xl border border-[#e8edf5] bg-white p-6 lg:p-12"><div className="w-full"><Outlet /></div></main>
      </div>
    </div>
  )
}

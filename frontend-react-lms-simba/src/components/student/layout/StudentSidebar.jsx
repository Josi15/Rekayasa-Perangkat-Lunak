import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarDays, ClipboardList, LayoutDashboard, LifeBuoy, ListChecks, LogOut, UserCheck, UserRound, X } from 'lucide-react'
import Logo from '../../common/Logo.jsx'
import { Modal } from '../../common/Modal.jsx'
import { ACADEMIC_YEAR } from '../../../data/student.js'
import { useAuth } from '../../../hooks/useAuth.js'

const items = [
  ['Dashboard', '/student', LayoutDashboard],
  ['Jadwal KBM', '/student/schedule', CalendarDays],
  ['Detail Mapel', '/student/classes', BookOpen],
  ['Tugas & Berkas', '/student/tasks', ClipboardList],
  ['Presensi Mandiri', '/student/attendance', UserCheck],
  ['Kuis CBT', '/student/quiz', ListChecks],
  ['Profil Siswa', '/student/profile', UserRound],
]

export default function StudentSidebar({ open, onClose }) {
  const [help, setHelp] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 transform flex-col border-r border-simba-line bg-white p-4 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Logo variant="mark" className="size-10" rounded="rounded-lg" /><div className="leading-tight"><b className="text-lg text-simba-dark">simba</b><p className="text-[10px] text-slate-400">SMAN 1 Teladan</p></div></div>
          <button onClick={onClose} className="lg:hidden" aria-label="Tutup menu"><X className="size-5" /></button>
        </div>
        <p className="mb-4 flex items-center justify-between rounded-lg bg-simba-bg px-3 py-2 text-xs font-medium text-slate-600">{ACADEMIC_YEAR}<span className="size-2 rounded-full bg-simba-lime" /></p>
        <nav className="flex-1 space-y-1">
          {items.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} end={to === '/student'} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-simba-dark text-white' : 'text-slate-600 hover:bg-simba-bg'}`}>
              <Icon className="size-[18px]" />{label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setHelp(true)} className="mt-4 flex items-center justify-between rounded-xl bg-simba-bg px-3 py-3 text-sm font-medium text-simba-dark hover:bg-brand-100"><span className="flex items-center gap-2"><LifeBuoy className="size-4" />Bantuan Siswa</span><ArrowRight className="size-4" /></button>
        <button onClick={() => { logout(); navigate("/login") }} className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"><LogOut className="size-4" />Keluar</button>
      </aside>
      <Modal open={help} title="Bantuan Siswa" onClose={() => setHelp(false)}>
        <p className="text-sm text-slate-600">Kendala akun atau tugas? Hubungi wali kelas Anda atau Tata Usaha SMAN 1 Teladan pada jam sekolah. Informasi kontak resmi tersedia di papan pengumuman sekolah.</p>
      </Modal>
    </>
  )
}

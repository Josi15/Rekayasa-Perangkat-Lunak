import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import Dropdown from '../../common/Dropdown.jsx'
import NotificationBell from '../../layout/NotificationBell.jsx'
import { useAuth } from '../../../hooks/useAuth.js'
import { profileSeed } from '../../../data/student.js'

export default function StudentHeader({ onMenu }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const search = (e) => { e.preventDefault(); navigate(`/student/tasks${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`) }
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 px-4 lg:px-8">
      <button onClick={onMenu} className="lg:hidden" aria-label="Buka menu"><Menu className="size-6" /></button>
      <form onSubmit={search} className="relative max-w-xl flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tugas atau mata pelajaran..." aria-label="Cari tugas"
          className="w-full rounded-xl border border-simba-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
      </form>
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell uid={user.id} />
        <Dropdown
          trigger={<span className="flex items-center gap-2"><span className="hidden text-right text-sm leading-tight sm:block"><b className="block text-slate-900">{user.name}</b><span className="text-xs text-slate-500">{profileSeed[user.id]?.className}</span></span><span className="grid size-9 place-items-center rounded-full bg-simba-dark text-sm font-semibold text-white">{user.name[0]}</span></span>}
          items={[{ label: 'Profil saya', onClick: () => navigate('/student/profile') }, { label: 'Keluar', onClick: () => { logout(); navigate('/login') } }]}
        />
      </div>
    </header>
  )
}

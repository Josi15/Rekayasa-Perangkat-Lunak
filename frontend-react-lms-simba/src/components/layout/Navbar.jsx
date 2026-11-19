import { useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Dropdown from '../common/Dropdown.jsx'
import NotificationBell from './NotificationBell.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { roleLabels } from '../../utils/menus.js'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = [
    ...(user.role === 'student' ? [{ label: 'Profil saya', onClick: () => navigate('/student/profile') }] : []),
    { label: 'Keluar', onClick: () => { logout(); navigate('/login') } },
  ]
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      <button onClick={onMenuClick} className="lg:hidden" aria-label="Buka menu"><Menu className="size-6" /></button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-1">
        {user.role === 'student' && <NotificationBell uid={user.id} />}
        <Dropdown
          trigger={
            <span className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">{user.name[0]}</span>
              <span className="hidden text-left text-sm sm:block"><b className="block leading-tight">{user.name}</b><span className="text-xs text-slate-500">{roleLabels[user.role]}</span></span>
            </span>
          }
          items={items}
        />
      </div>
    </header>
  )
}

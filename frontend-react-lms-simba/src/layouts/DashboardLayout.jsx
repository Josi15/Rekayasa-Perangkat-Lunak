import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Logo from '../components/layout/Logo'
import UserBadge from '../components/layout/UserBadge'
import DemoBanner from '../components/layout/DemoBanner'
import ConfirmationDialog from '../components/common/ConfirmationDialog'
import { useAuth } from '../contexts/AuthContext'
import { navigation } from '../routes/navigation'

// Layout dasar bersama semua peran; layout per peran hanya menentukan `role`.
// Mobile/tablet (<lg): sidebar jadi laci + header ringkas. Desktop: sidebar tetap; halaman guru membawa TopBar
// sendiri (dengan pencarian, sesuai desain) sehingga baris identitas global hanya untuk siswa & admin.
export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  return (
    <div className="min-h-screen bg-brand-50">
      <Sidebar items={navigation[role]} basePath={`/${role}`} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={() => setConfirmLogout(true)} />
      <div className="lg:pl-64 print:pl-0">
        {/* Satu header untuk semua ukuran layar. Guru memakai TopBar per halaman (dengan pencarian), jadi tanpa badge di sini. */}
        <header className={`flex h-14 items-center justify-between gap-3 bg-white px-4 print:hidden lg:h-auto lg:bg-transparent lg:px-8 lg:pt-6 ${role === 'teacher' ? 'lg:hidden' : ''}`}>
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu size={22} /></button><Logo />
          </div>
          {role !== 'teacher' && <div className="ml-auto"><UserBadge user={user} /></div>}
        </header>
        <main className={`min-w-0 p-4 lg:p-8 ${role === 'teacher' ? '' : 'lg:pt-4'}`}>
          <DemoBanner />
          <Outlet />
        </main>
      </div>
      <ConfirmationDialog open={confirmLogout} title="Keluar dari LMS Simba?" message="Sesi Anda akan diakhiri."
        confirmLabel="Keluar" onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { logout(); navigate('/login') }} />
    </div>
  )
}

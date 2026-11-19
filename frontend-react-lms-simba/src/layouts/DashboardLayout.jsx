import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import { roleMenus } from '../utils/menus.js'

export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar menu={roleMenus[role]} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}

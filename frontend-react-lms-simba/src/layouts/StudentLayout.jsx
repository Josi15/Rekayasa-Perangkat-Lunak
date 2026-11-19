import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import StudentSidebar from '../components/student/layout/StudentSidebar.jsx'
import StudentHeader from '../components/student/layout/StudentHeader.jsx'

export default function StudentLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="theme-simba flex h-screen bg-simba-bg font-sans text-slate-800">
      <StudentSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <StudentHeader onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-8 lg:px-8"><Outlet /></main>
      </div>
    </div>
  )
}

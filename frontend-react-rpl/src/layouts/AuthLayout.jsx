import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 to-white p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-brand-700"><GraduationCap className="size-8" />LMS Simba</div>
        <Outlet />
      </div>
    </div>
  )
}

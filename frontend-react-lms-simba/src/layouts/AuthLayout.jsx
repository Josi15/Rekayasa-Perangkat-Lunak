import { Outlet } from 'react-router-dom'
import Logo from '../components/layout/Logo'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo size="lg" /></div>
        <div className="card p-6 sm:p-8"><Outlet /></div>
      </div>
    </div>
  )
}

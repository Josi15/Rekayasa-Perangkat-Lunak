import { NavLink } from 'react-router-dom'
import { GraduationCap, X } from 'lucide-react'

export default function Sidebar({ menu, open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2 text-lg font-bold text-brand-700"><GraduationCap className="size-6" />LMS Simba</div>
          <button onClick={onClose} className="lg:hidden" aria-label="Tutup menu"><X className="size-5" /></button>
        </div>
        <nav className="space-y-1 px-3">
          {menu.map(({ label, to, icon: Icon, soon }) =>
            soon ? (
              <div key={label} className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400" aria-disabled="true">
                <Icon className="size-5" />{label}
                <span className="ml-auto rounded bg-slate-100 px-1.5 text-[10px]">Segera</span>
              </div>
            ) : (
              <NavLink key={label} to={to} end={to.split("/").length <= 2} onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon className="size-5" />{label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>
    </>
  )
}

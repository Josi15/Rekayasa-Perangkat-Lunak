import { NavLink } from 'react-router-dom'
import { X, LogOut } from 'lucide-react'
import Logo from './Logo'

const link = (bottom) => ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
    isActive ? (bottom ? 'bg-brand-100 text-brand-700' : 'bg-brand-600 text-white') : bottom ? 'bg-brand-50 text-slate-700 hover:bg-brand-100' : 'text-slate-700 hover:bg-brand-50'}`

export default function Sidebar({ items, basePath, open, onClose, onLogout }) {
  const render = (list, bottom) => list.map(({ label, path, icon: Icon }) => (
    <NavLink key={path} to={`${basePath}/${path}`} onClick={onClose} className={link(bottom)}><Icon size={18} /> {label}</NavLink>
  ))
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`print:hidden fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between px-6">
          <Logo />
          <button className="lg:hidden" onClick={onClose} aria-label="Tutup menu"><X size={20} /></button>
        </div>
        <p className="px-6 pb-2 text-xs font-semibold tracking-wider text-slate-500">MENU UTAMA</p>
        <nav aria-label="Menu utama" className="flex-1 space-y-1 overflow-y-auto px-3">{render(items.filter((i) => !i.bottom), false)}</nav>
        <div className="space-y-1 p-3">
          {render(items.filter((i) => i.bottom), true)}
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"><LogOut size={18} /> Keluar</button>
        </div>
      </aside>
    </>
  )
}

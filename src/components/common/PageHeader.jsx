import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Breadcrumb({ items }) {
  return (
    <nav className="mb-1 flex items-center gap-1 text-sm text-slate-500">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5" />}
          {it.to ? <Link to={it.to} className="hover:text-brand-600">{it.label}</Link> : <span className="text-slate-700">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export default function PageHeader({ title, description, breadcrumb, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

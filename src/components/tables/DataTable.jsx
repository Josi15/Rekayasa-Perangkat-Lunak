import { useMemo, useState } from 'react'
import SearchBar from './SearchBar.jsx'
import Pagination from './Pagination.jsx'
import { EmptyState } from '../common/States.jsx'

export default function DataTable({ columns, rows, pageSize = 5, searchPlaceholder }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q))) : rows
  }, [rows, query])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4"><SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder={searchPlaceholder} /></div>
      {visible.length === 0 ? <EmptyState title="Data tidak ditemukan" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{columns.map((c) => <th key={c.key} className="px-4 py-2.5 font-medium">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((r) => (
                <tr key={r.id}>{columns.map((c) => <td key={c.key} className="px-4 py-3 text-slate-700">{c.render ? c.render(r) : r[c.key]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={current} pages={pages} onChange={setPage} />
    </div>
  )
}

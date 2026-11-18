export default function NumberedPagination({ page, totalPages, total, pageSize, onChange, noun = 'berkas modul materi' }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-slate-500">
      <span>Menampilkan {from}-{to} dari {total} {noun}</span>
      <div className="flex items-center gap-2">
        <button className="px-2 disabled:opacity-40" disabled={page <= 1} onClick={() => onChange(page - 1)}>Sebelumnya</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button key={n} aria-label={`Halaman ${n}`} aria-current={n === page ? 'page' : undefined} onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-md text-sm font-semibold ${n === page ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-brand-100'}`}>{n}</button>
        ))}
        <button className="px-2 font-medium text-slate-800 disabled:opacity-40" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Selanjutnya</button>
      </div>
    </div>
  )
}

const MAP = {
  todo: ['Belum dikerjakan', 'bg-amber-100 text-amber-700'],
  overdue: ['Belum dikumpulkan (lewat tenggat)', 'bg-red-100 text-red-700'],
  submitted: ['Menunggu penilaian', 'bg-blue-100 text-blue-700'],
  graded: ['Sudah dinilai', 'bg-emerald-100 text-emerald-700'],
  closed: ['Ditutup guru', 'bg-slate-200 text-slate-600'],
}

export default function TaskStatusBadge({ state, late }) {
  const [label, cls] = MAP[state] ?? [state, 'bg-slate-100 text-slate-600']
  return (
    <span className="inline-flex flex-wrap justify-end gap-1">
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
      {late && <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Dikumpulkan terlambat</span>}
    </span>
  )
}

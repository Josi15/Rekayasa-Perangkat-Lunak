const map = {
  todo: ['Belum dikerjakan', 'bg-amber-50 text-amber-700'],
  overdue: ['Terlambat', 'bg-red-50 text-red-700'],
  submitted: ['Dikumpulkan', 'bg-blue-50 text-blue-700'],
  graded: ['Dinilai', 'bg-emerald-50 text-emerald-700'],
}
export default function TaskStatusBadge({ task }) {
  const [label, cls] = map[task.status]
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
      {task.isLate && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Dikumpulkan terlambat</span>}
    </span>
  )
}

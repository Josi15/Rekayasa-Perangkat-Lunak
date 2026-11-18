const map = {
  not_started: ['Belum dimulai', 'bg-slate-100 text-slate-600'],
  in_progress: ['Berjalan', 'bg-blue-50 text-blue-700'],
  completed: ['Selesai', 'bg-emerald-50 text-emerald-700'],
}
export const statusLabels = { not_started: 'Belum dimulai', in_progress: 'Berjalan', completed: 'Selesai' }
export default function CourseStatus({ status }) {
  const [label, cls] = map[status]
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

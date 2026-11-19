const styles = {
  active: 'bg-emerald-50 text-emerald-700', open: 'bg-emerald-50 text-emerald-700', published: 'bg-emerald-50 text-emerald-700', ready: 'bg-emerald-50 text-emerald-700', submitted: 'bg-blue-50 text-blue-700',
  inactive: 'bg-slate-100 text-slate-600', closed: 'bg-slate-100 text-slate-600', draft: 'bg-amber-50 text-amber-700',
}
export default function StatusBadge({ status }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

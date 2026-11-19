export default function StatisticCard({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-lg bg-brand-50 p-3 text-brand-600"><Icon className="size-6" /></div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export default function ProgressBar({ percent, label }) {
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{label}</span><span>{percent}%</span></div>}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

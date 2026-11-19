export default function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {options.map(([v, label, count]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`rounded-full border px-3 py-1.5 text-sm ${value === v ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
          {label}{count !== undefined && <span className="ml-1.5 opacity-75">{count}</span>}
        </button>
      ))}
    </div>
  )
}

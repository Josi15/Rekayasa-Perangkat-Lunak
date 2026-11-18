// Filter berbentuk chip (satu pilihan). options: [[nilai, label, jumlah?]].
export default function Chips({ value, onChange, options, label = 'Filter' }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(([v, text, count]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${value === v ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-500'}`}>
          {text}{count !== undefined && <span className={`ml-1.5 text-xs ${value === v ? 'text-brand-100' : 'text-slate-500'}`}>{count}</span>}
        </button>
      ))}
    </div>
  )
}

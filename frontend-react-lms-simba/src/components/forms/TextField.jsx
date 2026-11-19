export default function TextField({ label, error, right, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <span className="relative block">
        <input {...props} className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 ${error ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'}`} />
        {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

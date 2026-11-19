export default function TextArea({ label, error, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea {...props} className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 ${error ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'}`} />
      <span className="flex justify-between text-xs"><span className="text-red-600">{error}</span><span className="text-slate-400">{hint}</span></span>
    </label>
  )
}

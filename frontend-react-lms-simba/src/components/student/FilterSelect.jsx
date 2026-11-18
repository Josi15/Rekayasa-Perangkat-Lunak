export default function FilterSelect({ label, value, onChange, options }) {
  return (
    <select aria-label={label} className="input w-auto" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
    </select>
  )
}

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Dropdown({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
        {trigger}
        <ChevronDown className="size-4 text-slate-500" />
      </button>
      {open && (
        <ul className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-40 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg`}>
          {items.map((i) => (
            <li key={i.label}>
              <button onClick={() => { setOpen(false); i.onClick() }} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">{i.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

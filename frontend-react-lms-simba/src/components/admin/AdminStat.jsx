// Kartu ringkasan gaya dashboard admin (label kecil kapital, angka besar, kotak ikon, catatan kaki).
export default function AdminStat({ label, value, unit, icon: Icon, foot, tone = 'brand' }) {
  const box = tone === 'warn' ? 'bg-amber-100 text-amber-700' : tone === 'gray' ? 'bg-slate-100 text-slate-600' : 'bg-brand-100 text-brand-600'
  return (
    <div className="panel space-y-4">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900">{value} {unit && <span className="text-base font-normal text-slate-500">{unit}</span>}</p>
        </div>
        {Icon && <div className={`h-fit rounded-xl p-3 ${box}`}><Icon size={22} /></div>}
      </div>
      {foot && <p className="text-xs text-slate-500">{foot}</p>}
    </div>
  )
}

export const StatGrid = ({ children, cols = 4 }) => <div className={`mb-6 grid gap-4 sm:grid-cols-2 ${cols === 4 ? 'xl:grid-cols-4' : cols === 3 ? 'xl:grid-cols-3' : ''}`}>{children}</div>

export const Pill = ({ children, tone = 'brand' }) => {
  const t = tone === 'warn' ? 'bg-amber-100 text-amber-700' : tone === 'bad' ? 'bg-red-100 text-red-700' : tone === 'gray' ? 'bg-slate-100 text-slate-600' : 'bg-brand-100 text-brand-700'
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${t}`}>{children}</span>
}

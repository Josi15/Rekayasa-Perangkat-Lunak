// Kepala halaman admin gaya desain prototype: "SIMBA Admin › Grup" + judul besar + aksi di kanan.
export default function AdminHead({ group, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-sm text-slate-500">SIMBA Admin › <span className="font-semibold text-brand-700">{group}</span></p>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

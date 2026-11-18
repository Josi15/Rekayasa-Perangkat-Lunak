export default function WelcomeBanner({ name, home }) {
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <section className="rounded-2xl bg-gradient-to-r from-brand-100 to-brand-50 px-6 py-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-200 px-3 py-1 text-brand-700"><span className="h-2 w-2 rounded-full bg-brand-600" />Tahun Ajaran {home.academicYear}</span>
        <span className="hidden text-slate-300 sm:inline">|</span><span>{today}</span>
      </div>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-4xl">Selamat Bertugas, {name}</h1>
      <p className="mt-3 text-sm text-slate-600">NIP {home.nip} • <b className="text-brand-600">Guru {home.subject}</b> • Wali Kelas {home.homeroom.name}</p>
    </section>
  )
}

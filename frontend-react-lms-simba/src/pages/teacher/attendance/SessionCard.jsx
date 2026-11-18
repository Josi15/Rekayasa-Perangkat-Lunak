import { Building2, Wifi, KeyRound, Printer, Lock, LockOpen } from 'lucide-react'

const Box = ({ label, value, unit, tone = 'text-slate-900' }) => (
  <div className="min-w-24 rounded-lg bg-white px-3 py-2"><p className={`text-xs ${tone === 'text-slate-900' ? 'text-slate-500' : tone}`}>{label}</p><p className="text-xl font-bold">{value} <span className={`text-xs font-normal ${tone === 'text-slate-900' ? 'text-slate-600' : tone}`}>{unit}</span></p></div>
)

export default function SessionCard({ session: s, open, stats: st, onToggle, onPrint }) {
  return (
    <section className="grid gap-4 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 p-6 lg:grid-cols-[1fr_auto]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${open ? 'bg-brand-200 text-brand-700' : 'bg-slate-200 text-slate-600'}`}><span className={`h-2 w-2 rounded-full ${open ? 'bg-brand-600' : 'bg-slate-500'}`} />{open ? 'Sesi Berlangsung Sekarang' : 'Sesi Ditutup'}</span>
          <span className="text-slate-600">{s.mode}</span>
        </div>
        <h2 className="text-xl font-extrabold sm:text-2xl">{s.title}</h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
          <span className="inline-flex items-center gap-1.5"><Building2 size={15} />{s.room}</span>
          <span className="inline-flex items-center gap-1.5"><Wifi size={15} />SSID: <b>{s.ssid}</b></span>
          <span className="inline-flex items-center gap-1.5"><KeyRound size={15} />Kode Token: <b className="rounded bg-slate-200 px-2 py-0.5 font-mono">{s.token}</b></span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Box label="Roster Kelas" value={st.total} unit="Siswa" />
          <Box label="Hadir" value={st.h} unit={`(${st.pct}%)`} tone="text-brand-700" />
          <Box label="Izin Resmi" value={st.i} unit="Siswa" tone="text-brand-700" />
          <Box label="Sakit" value={st.s} unit="Surat" tone="text-red-700" />
          <Box label="Tanpa Ket. (Alpha)" value={st.a} unit="" />
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:w-64 print:hidden">
        <button className="btn-secondary" onClick={onPrint}><Printer size={16} /> Cetak Berita Acara (PDF)</button>
        <button onClick={onToggle} className={`btn ${open ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>{open ? <><Lock size={16} /> Tutup Sesi Presensi</> : <><LockOpen size={16} /> Buka Kembali Sesi</>}</button>
      </div>
    </section>
  )
}

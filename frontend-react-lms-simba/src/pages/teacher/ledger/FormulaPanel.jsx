import { Calculator, Lock, LockOpen } from 'lucide-react'
import { ledgerConfig as c } from '../../../data/ledger'

const pct = (n) => Math.round(n * 100)
export const formulaText = `NA = (Rata Tugas × ${pct(c.weights.tugas)}%) + (Rata Kuis CBT × ${pct(c.weights.cbt)}%) + (Skor PTS × ${pct(c.weights.pts)}%)`

export default function FormulaPanel({ locked, dirty, onSave, onLock }) {
  return (
    <section className="grid gap-4 rounded-2xl bg-brand-50 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="space-y-2 text-sm text-slate-700">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-700"><Calculator size={14} />Formula Transparan Penilaian Kurikulum Merdeka</p>
        <p><b>Rumus Pembobotan:</b> {formulaText}. Predikat A dihitung untuk NA ≥ 90.0, Predikat B untuk NA 75.0 - 89.9. Siswa dinyatakan <b>Tuntas</b> jika memenuhi atau melampaui KKTP ({c.kktp.toFixed(1)}).</p>
        <p className="flex flex-wrap gap-x-5 text-xs text-brand-700"><span>• Validasi Guru Pengampu: {locked ? 'Terkunci' : 'Belum dikunci'}</span><span>• Sinkronisasi Dapodik: Belum terhubung (simulasi)</span></p>
      </div>
      <div className="flex gap-3">
        <button className="btn-secondary !bg-slate-100" disabled={locked || !dirty} onClick={onSave}>Simpan Draf Leger</button>
        <button className="btn-primary max-w-44 !py-3 text-xs" onClick={onLock}>{locked ? <><LockOpen size={14} /> Buka Kunci Leger</> : <><Lock size={14} /> Kunci & Kirim Nilai ke Buku Induk Rapor</>}</button>
      </div>
    </section>
  )
}

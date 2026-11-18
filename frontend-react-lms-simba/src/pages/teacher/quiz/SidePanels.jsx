import { useState } from 'react'
import { PlugZap, KeyRound, Copy, RefreshCw } from 'lucide-react'
import Modal from '../../../components/common/Modal'

const steps = [
  ['Buat Kuis di Google Form', "Pastikan fitur 'Jadikan ini kuis' dan opsi 'Kumpulkan email/NISN' aktif."],
  ['Salin Link Edit / Respon', "Klik tombol 'Tautkan Google Form Baru' di atas lalu tempel URL formulir."],
  ['Sinkronkan ke Leger', 'Saat integrasi aktif, SIMBA menarik skor responden ke buku nilai rapor.'],
]

export default function SidePanels({ token, onCopy, onNewToken }) {
  const [docs, setDocs] = useState(false)
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-50 p-5">
        <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-brand-600 p-2.5 text-white"><PlugZap size={18} /></span><div><h2 className="font-bold">3 Langkah Tautkan Form</h2><p className="text-xs text-slate-600">Google Form API (simulasi)</p></div></div>
        <ol className="space-y-4 text-sm">{steps.map(([t, d], i) => <li key={t} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-200 text-xs font-bold text-brand-700">{i + 1}</span><div><p className="font-semibold">{t}</p><p className="text-xs text-slate-600">{d}</p></div></li>)}</ol>
        <button className="mt-4 text-sm font-semibold text-brand-700 hover:underline" onClick={() => setDocs(true)}>Pelajari dokumentasi lengkap →</button>
      </section>
      <section className="rounded-2xl bg-brand-50 p-5 space-y-3">
        <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><KeyRound size={18} />Token Kuis Darurat</h2><span className="rounded bg-white px-2 py-0.5 text-xs text-slate-600">Valid 15m</span></div>
        <p className="text-xs text-slate-600">Gunakan token ini untuk membuka kembali sesi kuis siswa yang mengalami kendala browser tertutup atau perangkat mati.</p>
        <div className="flex items-center justify-between rounded-xl bg-white p-3"><div><p className="font-mono text-[10px] uppercase text-slate-500">Kode token saat ini</p><p data-testid="token" className="font-mono text-2xl font-extrabold tracking-widest text-brand-700">{token}</p></div><button aria-label="Salin token" onClick={() => onCopy(token, 'Token disalin.')}><Copy size={16} /></button></div>
        <button className="btn-secondary w-full !bg-slate-100" onClick={onNewToken}><RefreshCw size={14} /> Generate Token Baru</button>
      </section>
      <Modal open={docs} title="Dokumentasi Singkat" onClose={() => setDocs(false)} footer={<button className="btn-secondary" onClick={() => setDocs(false)}>Tutup</button>}>
        <ul className="list-disc space-y-2 pl-5"><li>Integrasi Google Forms API belum tersedia pada fase frontend ini; tautan hanya dicatat, tidak diverifikasi ke Google.</li><li>Nilai responden akan ditarik lewat backend setelah API disepakati tim.</li><li>Token darurat pada versi ini dibuat acak di sisi klien (simulasi).</li></ul>
      </Modal>
    </div>
  )
}

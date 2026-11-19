import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Hourglass, ListOrdered, ShieldCheck } from 'lucide-react'
import { Card, Eyebrow, Pill } from '../../components/student/ui.jsx'
import Chips from '../../components/student/Chips.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentQuiz } from '../../services/index.js'
import { fmtDate, fmtDateTime } from '../../utils/date.js'
import { btnPrimary } from '../../utils/styles.js'

const RULES = [
  ['Koneksi & perangkat terdaftar', 'Pastikan baterai mencukupi dan terhubung dengan Wi-Fi sekolah atau jaringan stabil tanpa proxy pihak ketiga.'],
  ['Prinsip satu pengiriman (single submission)', 'Formulir hanya dapat diisi satu kali per akun. Jawaban yang sudah dikirim tidak dapat diubah.'],
  ['Proctoring & keamanan peramban', 'Dilarang membuka tab atau aplikasi lain saat berlangsung. Waktu pengerjaan dibatasi dan jawaban terkirim otomatis saat waktu habis.'],
]

export default function Quiz() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentQuiz.overview(user.id), [user.id]))
  const [tab, setTab] = useState('active')
  return (
    <div className="space-y-5">
      <div><Eyebrow>Modul asesmen akademik digital</Eyebrow><h1 className="text-3xl font-extrabold text-slate-900">Kuis & Asesmen Terintegrasi</h1></div>
      <AsyncBoundary state={state}>
        {(o) => (
          <>
            <Chips value={tab} onChange={setTab} options={[['active', 'Kuis Aktif', o.active.length], ['upcoming', 'Kuis Mendatang', o.upcoming.length], ['history', 'Riwayat & Nilai Kuis', o.history.length]]} />
            {tab === 'active' && (o.active.length === 0 ? <Card><EmptyState title="Tidak ada kuis aktif" description="Kuis yang sudah dikerjakan ada di tab Riwayat & Nilai." /></Card> : o.active.map((q) => (
              <div key={q.id} className="grid gap-5 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <Pill tone={q.expired ? 'slate' : 'red'}>Batas akhir: {fmtDateTime(q.due)} WIB</Pill>
                  <p className="mt-3 text-xs text-slate-500">{q.courseName} • Penguji: {q.teacher}</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">{q.title}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-simba-bg p-4 text-sm"><p className="flex items-center gap-2"><ListOrdered className="size-4 text-brand-600" /><span><span className="block text-[11px] uppercase text-slate-500">Bentuk soal</span><b>{q.totalQuestions} butir pilihan ganda</b></span></p><p className="flex items-center gap-2"><Hourglass className="size-4 text-brand-600" /><span><span className="block text-[11px] uppercase text-slate-500">Alokasi waktu</span><b>{q.durationMin} menit</b></span></p></div>
                  {q.expired ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Batas waktu kuis telah berakhir.</p> : <Link to={`/student/quiz/${q.id}`} className={`${btnPrimary} mt-4`}>Mulai Kerjakan Kuis Sekarang <ArrowRight className="size-4" /></Link>}
                </Card>
                <Card title="Kesiapan Sesi CBT" action={<Pill>Data simulasi</Pill>}>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between"><span className="text-slate-500">Latensi jaringan sekolah</span><b>18 ms (Optimal)</b></li>
                    <li className="flex justify-between"><span className="text-slate-500">Batas toleransi keterlambatan</span><b>15 menit</b></li>
                    <li className="flex justify-between"><span className="text-slate-500">Validasi form ID</span><b>#BIO12-03-24</b></li>
                    <li><span className="flex justify-between"><span className="text-slate-500">Siswa selesai (kelas XII MIPA 1)</span><b>24/36</b></span><span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full w-2/3 rounded-full bg-brand-600" /></span></li>
                  </ul>
                </Card>
              </div>
            )))}
            {tab === 'upcoming' && (o.upcoming.length === 0 ? <Card><EmptyState title="Belum ada kuis mendatang" /></Card> : <div className="grid gap-3 md:grid-cols-2">{o.upcoming.map((q) => <Card key={q.id}><p className="text-xs text-slate-500">{q.courseName}</p><b className="text-slate-900">{q.title}</b><p className="mt-2 text-xs text-slate-500">Dibuka s.d. {fmtDate(q.due)} • {q.durationMin} menit</p><p className="mt-2"><Pill tone="amber">Belum dibuka</Pill></p></Card>)}</div>)}
            {tab === 'history' && (o.history.length === 0 ? <Card><EmptyState title="Belum ada riwayat kuis" /></Card> : (
              <div className="grid gap-3 md:grid-cols-3">
                {o.history.map((h) => (
                  <Card key={h.id}>
                    <p className="flex justify-between text-xs"><Pill>{h.course}</Pill><span className="text-slate-500">{fmtDate(h.date)}</span></p>
                    <b className="mt-2 block text-sm text-slate-900">{h.title}</b><p className="text-xs text-slate-500">{h.questions} soal</p>
                    <p className="mt-3 flex items-end justify-between"><span className="text-xs text-slate-500">Nilai masuk buku nilai</span><span className="text-right"><b className={`text-3xl ${h.score >= h.kkm ? 'text-brand-700' : 'text-red-600'}`}>{h.score}</b><span className="block text-[10px] text-slate-500">KKM {h.kkm}</span></span></p>
                  </Card>
                ))}
              </div>
            ))}
            <Card title="Prosedur & Regulasi Integritas Asesmen Digital SMAN 1 Teladan" icon={ShieldCheck}>
              <ol className="grid gap-3 md:grid-cols-3">{RULES.map(([t, d], i) => <li key={t} className="flex gap-3 text-sm"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{i + 1}</span><span><b className="block text-slate-900">{t}</b><span className="text-slate-600">{d}</span></span></li>)}</ol>
            </Card>
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}

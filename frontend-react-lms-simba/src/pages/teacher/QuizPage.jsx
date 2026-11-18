import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link2, PlusCircle, Shuffle } from 'lucide-react'
import TopBar from '../../components/layout/TopBar'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import Modal from '../../components/common/Modal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import QuizStats from './quiz/QuizStats'
import FeaturedQuiz from './quiz/FeaturedQuiz'
import QuizTable from './quiz/QuizTable'
import SidePanels from './quiz/SidePanels'
import QuizFormModal from './quiz/QuizFormModal'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { quizService as svc } from '../../services'
import { teacherHome } from '../../data/teacherHome'
import { toCsv, downloadCsv } from '../../utils/csv'

const tabs = [['all', 'Semua Kuis'], ['running', 'Kuis Berlangsung'], ['scheduled', 'Terjadwal'], ['finished', 'Riwayat Selesai']]

export default function QuizPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [cls, setCls] = useState(null)
  const [form, setForm] = useState(null)
  const [resp, setResp] = useState(null)
  const [del, setDel] = useState(null)
  const refresh = useCallback(() => svc.list().then(setData).catch((e) => setError(e.message)), [])
  useEffect(() => { refresh() }, [refresh])

  const act = async (fn, msg) => { try { await fn(); await refresh(); if (msg) notify(msg, 'success') } catch (e) { notify(e.message, 'error') } }
  const copy = async (text, msg) => { try { await navigator.clipboard.writeText(text); notify(msg, 'success') } catch { notify('Gagal menyalin; salin secara manual.', 'error') } }
  const sync = (x) => act(() => svc.sync(x.id), `Nilai "${x.title}" disinkronkan ke Leger (simulasi).`)

  const cid = cls ?? data?.classOptions[0]?.id ?? 'all'
  const inClass = useMemo(() => (data?.quizzes ?? []).filter((x) => (cid === 'all' || x.classIds.includes(Number(cid))) && x.title.toLowerCase().includes(q.toLowerCase())), [data, cid, q])
  const rows = inClass.filter((x) => tab === 'all' || x.status === tab)
  const count = (s) => inClass.filter((x) => s === 'all' || x.status === s).length
  const featured = inClass.find((x) => x.status === 'running')
  const on = { status: (x, s, m) => act(() => svc.setStatus(x.id, s), m), sync, responses: setResp, copy, remove: setDel,
    csv: (x) => { downloadCsv('rekap-kuis.csv', toCsv([{ key: 'title', header: 'Kuis' }, { key: 'rombel', header: 'Rombel' }, { key: 'type', header: 'Tipe' }, { key: 'respon', header: 'Respon' }, { key: 'avg', header: 'Rerata' }], [{ title: x.title, rombel: x.rombel, type: `${x.questionCount} ${x.type}`, respon: `${x.done}/${x.total}`, avg: x.avg }])); notify('CSV diunduh dari data simulasi.', 'success') } }

  return (
    <div>
      <TopBar query={q} onQuery={setQ} placeholder="Cari kuis" name={user.name} subtitle={`Guru ${teacherHome.subject} & Wali Kelas ${teacherHome.homeroom.name}`} />
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="flex items-center gap-1.5 text-xs text-slate-600"><Shuffle size={12} className="text-brand-700" /><b className="text-brand-700">Asesmen Terpadu</b> • Google Forms & CBT Engine</p><h1 className="mt-1 max-w-2xl text-2xl font-extrabold sm:text-4xl">Bank Asesmen & Integrasi Kuis Form CBT</h1></div>
          <div className="flex gap-2"><button className="btn-secondary !bg-slate-100" onClick={() => setForm('google')}><Link2 size={15} /> Tautkan Google Form Baru</button><button className="btn-primary" onClick={() => setForm('engine')}><PlusCircle size={15} /> Buat Kuis Baru</button></div>
        </header>
        {error ? <ErrorState message={error} onRetry={refresh} /> : !data ? <LoadingState /> : (
          <>
            <QuizStats stats={data.stats} />
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? 'bg-brand-600 text-white' : 'bg-brand-50 text-slate-700 hover:bg-brand-100'}`}>{l} ({count(k)})</button>)}
              <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">Kelas:
                <select aria-label="Filter kelas" className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-800" value={cid} onChange={(e) => setCls(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                  {data.classOptions.map((c) => <option key={c.id} value={c.id}>{c.name} ({teacherHome.subject})</option>)}<option value="all">Semua Kelas</option></select></label>
            </div>
            {featured && <FeaturedQuiz quiz={featured} onSync={sync} onResponses={setResp} onCopy={copy} />}
            <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
              <div className="min-w-0 space-y-6">
                <QuizTable rows={rows} updatedAt={data.updatedAt} on={on} />
                <p className="rounded-2xl bg-brand-50 p-4 text-sm text-slate-700"><b className="block text-slate-900">Integrasi Nilai Otomatis ke Leger SIMBA</b>Saat integrasi Google Forms aktif, data responden akan diverifikasi berdasarkan NISN siswa secara otomatis dan dikonversi menjadi bobot penilaian formatif. Pada versi simulasi ini, sinkronisasi hanya menandai kuis sebagai tersinkron.</p>
              </div>
              <SidePanels token={data.token} onCopy={copy} onNewToken={() => act(() => svc.newToken(), 'Token baru dibuat (simulasi).')} />
            </div>
          </>
        )}
      </div>
      {form && <QuizFormModal mode={form} classes={data.classOptions} onClose={() => setForm(null)} onSubmit={(d) => { setForm(null); act(() => svc.create(d), form === 'google' ? 'Google Form ditautkan (simulasi, tidak diverifikasi).' : 'Kuis dibuat (simulasi).') }} />}
      <Modal open={!!resp} title="Respon Siswa" onClose={() => setResp(null)} footer={<button className="btn-secondary" onClick={() => setResp(null)}>Tutup</button>}>
        {resp && <div className="space-y-2"><p className="font-semibold">{resp.title}</p><p>Selesai: <b>{resp.done} / {resp.total}</b> · Belum menyelesaikan: <b>{resp.total - resp.done}</b></p><p>Rerata: <b>{resp.avg ?? '-'}</b> · Leger: {resp.syncedAt ? `tersinkron ${new Date(resp.syncedAt).toLocaleTimeString('id-ID')}` : 'belum disinkronkan'}</p><p className="text-xs text-slate-500">Daftar respon per siswa tersedia setelah integrasi Google Forms API.</p></div>}
      </Modal>
      <ConfirmationDialog open={!!del} title="Hapus kuis?" message={`Kuis "${del?.title}" akan dihapus.`} confirmLabel="Hapus" onCancel={() => setDel(null)} onConfirm={() => { const d = del; setDel(null); act(() => svc.remove(d.id), 'Kuis dihapus (simulasi).') }} />
    </div>
  )
}

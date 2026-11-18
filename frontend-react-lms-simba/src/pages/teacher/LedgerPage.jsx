import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, FileSpreadsheet, Users, CalendarDays, ShieldCheck } from 'lucide-react'
import TopBar from '../../components/layout/TopBar'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import LedgerStats from './ledger/LedgerStats'
import LedgerTable from './ledger/LedgerTable'
import FormulaPanel, { formulaText } from './ledger/FormulaPanel'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ledgerService as svc } from '../../services'
import { teacherHome } from '../../data/teacherHome'
import { ledgerConfig, computeNA, predikatOf, isTuntas, summarize } from '../../data/ledger'
import { downloadLedgerXlsx } from '../../utils/ledgerXlsx'

const validPts = (v) => v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100
const Chip = ({ icon: I, label, children }) => <div><p className="mb-1 text-xs text-slate-600">{label}</p><div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs"><I size={14} />{children}</div></div>

export default function LedgerPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [drafts, setDrafts] = useState({})
  const [confirm, setConfirm] = useState(false)
  const refresh = useCallback(() => svc.get().then(setData).catch((e) => setError(e.message)), [])
  useEffect(() => { refresh() }, [refresh])

  // Nilai tampilan = data tersimpan + draf yang valid (pratinjau langsung).
  const rows = useMemo(() => (data?.rows ?? []).map((r) => {
    const d = drafts[r.studentId]
    if (d === undefined || !validPts(d)) return r
    const na = computeNA(r.tugas, r.cbt, Number(d))
    return { ...r, pts: Number(d), na, predikat: predikatOf(na), tuntas: isTuntas(na) }
  }), [data, drafts])
  const stats = useMemo(() => summarize(rows), [rows])
  const hasInvalid = Object.values(drafts).some((v) => !validPts(v))
  const dirty = Object.keys(drafts).length > 0
  const [yr, sem] = teacherHome.academicYear.split(' ')

  const guard = async (fn, msg) => { try { await fn(); await refresh(); if (msg) notify(msg, 'success') } catch (e) { notify(e.message, 'error') } }
  const save = () => {
    if (hasInvalid) return notify('Perbaiki skor PTS yang tidak valid (0–100).', 'error')
    return guard(async () => { await svc.savePts(drafts); setDrafts({}) }, 'Draf leger disimpan (simulasi).')
  }
  const lock = () => {
    setConfirm(false)
    if (hasInvalid) return notify('Perbaiki skor PTS yang tidak valid (0–100).', 'error')
    return guard(async () => { if (dirty) await svc.savePts(drafts); setDrafts({}); await svc.setLocked(true) }, 'Leger dikunci & dikirim ke Buku Induk Rapor (simulasi, belum ada server).')
  }
  const pull = async () => { try { const n = await svc.pullCbt(); await refresh(); notify(`${n} kuis disinkronkan ke leger (simulasi).`, 'success') } catch (e) { notify(e.message, 'error') } }
  const exportXlsx = async () => {
    try { await downloadLedgerXlsx(rows, { className: data.className, term: `${sem} ${yr}`, kktp: ledgerConfig.kktp, formula: formulaText }); notify('Leger Excel diunduh (data simulasi).', 'success') }
    catch { notify('Gagal membuat file Excel.', 'error') }
  }
  const mins = data?.cbtSyncedAt ? Math.floor((Date.now() - data.cbtSyncedAt) / 60000) : null

  return (
    <div>
      <TopBar query={q} onQuery={(v) => { setQ(v); setPage(1) }} placeholder="Cari siswa" name={user.name} subtitle={`Guru ${teacherHome.subject} & Wali Kelas ${teacherHome.homeroom.name}`} />
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="max-w-2xl text-2xl font-extrabold sm:text-4xl">Buku Nilai Mata Pelajaran & Leger Kelas</h1>
          <div className="flex flex-col gap-3 print:hidden"><button className="btn-secondary !bg-slate-100" onClick={pull}><RefreshCw size={14} /> Tarik Nilai Kuis Form CBT</button><button className="btn-primary" onClick={exportXlsx} disabled={!data}><FileSpreadsheet size={14} /> Ekspor Leger Excel (.XLSX)</button></div>
        </header>
        {error ? <ErrorState message={error} onRetry={refresh} /> : !data ? <LoadingState /> : (
          <>
            <section className="flex flex-wrap items-end gap-4 rounded-2xl bg-brand-50 p-5">
              <Chip icon={Users} label="Rombel / Kelas">{data.className} ({rows.length} Siswa)</Chip>
              <Chip icon={CalendarDays} label="Tahun & Semester">{sem} {yr}</Chip>
              <Chip icon={ShieldCheck} label="Kriteria Ketuntasan (KKTP)"><b>KKTP: {ledgerConfig.kktp.toFixed(1)}</b></Chip>
              <p className="ml-auto rounded-full bg-white px-4 py-2 text-xs">● Status Data: <b>{mins == null ? 'Belum ditarik dari CBT' : `Tersinkron CBT (${mins < 1 ? 'Baru saja' : `${mins} Menit Lalu`})`}</b></p>
            </section>
            <LedgerStats s={stats} />
            <LedgerTable rows={rows} className={data.className} q={q} onQ={(v) => { setQ(v); setPage(1) }} page={page} onPage={setPage} drafts={drafts} locked={data.locked} total={rows.length} validDraft={validPts}
              onDraft={(id, v) => setDrafts((d) => { const base = data.rows.find((r) => r.studentId === id).pts; if (String(v) === String(base)) { const { [id]: _x, ...rest } = d; return rest } return { ...d, [id]: v } })} />
            <FormulaPanel locked={data.locked} dirty={dirty} onSave={save} onLock={() => (data.locked ? guard(() => svc.setLocked(false), 'Kunci leger dibuka.') : setConfirm(true))} />
          </>
        )}
      </div>
      <ConfirmationDialog open={confirm} title="Kunci & kirim nilai?" message="Skor PTS akan dikunci dan nilai dikirim ke Buku Induk Rapor. Pada versi simulasi ini belum ada pengiriman ke server." confirmLabel="Ya, kunci" onCancel={() => setConfirm(false)} onConfirm={lock} />
    </div>
  )
}

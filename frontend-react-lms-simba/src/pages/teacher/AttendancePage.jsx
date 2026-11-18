import { useCallback, useEffect, useState } from 'react'
import { History } from 'lucide-react'
import TopBar from '../../components/layout/TopBar'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import Modal from '../../components/common/Modal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import SessionCard from './attendance/SessionCard'
import AttendanceTable from './attendance/AttendanceTable'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { attendanceService as svc } from '../../services'
import { teacherHome } from '../../data/teacherHome'

export default function AttendancePage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [confirmClose, setConfirmClose] = useState(false)
  const [journal, setJournal] = useState(false)
  const refresh = useCallback(() => svc.get().then(setData).catch((e) => setError(e.message)), [])
  useEffect(() => { refresh() }, [refresh])

  // Ubah data lalu muat ulang tanpa menampilkan loading (tabel tidak berkedip).
  const act = async (fn, msg) => {
    try { const r = await fn(); await refresh(); if (msg) notify(typeof msg === 'function' ? msg(r) : msg, 'success') }
    catch (e) { notify(e.message, 'error') }
  }
  const [yr, sem] = teacherHome.academicYear.split(' ')

  return (
    <div>
      <TopBar query={q} onQuery={(v) => { setQ(v); setPage(1) }} placeholder="Cari siswa" name={user.name} subtitle={`Guru ${teacherHome.subject} & Wali Kelas ${teacherHome.homeroom.name}`} />
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs text-slate-600">• Semester {sem} {yr}</p><h1 className="mt-1 max-w-xl text-2xl font-extrabold sm:text-4xl">Manajemen Presensi KBM & Kehadiran Siswa</h1></div>
          <button className="btn-secondary print:hidden" onClick={() => setJournal(true)}><History size={16} /> Riwayat Jurnal Sesi</button>
        </header>
        {error ? <ErrorState message={error} onRetry={refresh} /> : !data ? <LoadingState /> : (
          <>
            <SessionCard session={data.session} open={data.open} stats={data.stats} onPrint={() => window.print()} onToggle={() => (data.open ? setConfirmClose(true) : act(() => svc.setOpen(true), 'Sesi presensi dibuka kembali.'))} />
            <AttendanceTable session={data.session} records={data.records} open={data.open} q={q} onQ={(v) => { setQ(v); setPage(1) }} page={page} onPage={setPage}
              onStatus={(id, s) => act(() => svc.setStatus(id, s))} onNote={(id, n) => act(() => svc.setNote(id, n))}
              onAllPresent={() => act(() => svc.markAllPresent(), (n) => (n ? `${n} siswa ditandai hadir (simulasi).` : 'Tidak ada siswa berstatus Alpha.'))} />
          </>
        )}
      </div>
      <ConfirmationDialog open={confirmClose} title="Tutup sesi presensi?" message="Status kehadiran akan dikunci sampai sesi dibuka kembali." confirmLabel="Ya, tutup" onCancel={() => setConfirmClose(false)}
        onConfirm={() => { setConfirmClose(false); act(() => svc.setOpen(false), 'Sesi presensi ditutup.') }} />
      <Modal open={journal} title="Riwayat Jurnal Sesi" onClose={() => setJournal(false)} footer={<button className="btn-secondary" onClick={() => setJournal(false)}>Tutup</button>}>
        {data && <ul className="divide-y divide-slate-100 text-sm">
          {[{ id: 0, date: 'Hari ini', label: data.session.slot + ' · ' + data.session.className, ...Object.fromEntries(['h', 'i', 's', 'a'].map((k) => [k, data.stats[k]])) }, ...data.history].map((j) => (
            <li key={j.id} className="py-2"><p className="font-medium">{j.date} — {j.label}</p><p className="text-xs text-slate-500">Hadir {j.h} · Izin {j.i} · Sakit {j.s} · Alpha {j.a}</p></li>))}
        </ul>}
      </Modal>
    </div>
  )
}

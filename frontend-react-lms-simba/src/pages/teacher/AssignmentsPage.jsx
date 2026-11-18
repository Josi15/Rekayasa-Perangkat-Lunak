import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Plus } from 'lucide-react'
import TopBar from '../../components/layout/TopBar'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import GradingStats from './grading/GradingStats'
import ActiveBanner from './grading/ActiveBanner'
import SubmissionSheet from './grading/SubmissionSheet'
import GradeDialog from './GradeDialog'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { teacherService, teacherAssignmentService as svc } from '../../services'
import { teacherHome } from '../../data/teacherHome'

export default function AssignmentsPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const sheetRef = useRef(null)
  const classes = useAsync(teacherService.classOptions)
  const [classId, setClassId] = useState(null)
  const cid = classId ?? classes.data?.[0]?.id ?? null
  const loadOv = useCallback(() => (cid ? svc.gradingOverview(cid) : Promise.resolve(null)), [cid])
  const ov = useAsync(loadOv)
  const [choice, setChoice] = useState(null)
  const selectedId = choice?.cid === cid ? choice.id : ov.data?.assignments[0]?.id ?? null
  const loadSheet = useCallback(() => (selectedId ? svc.roster(selectedId) : Promise.resolve(null)), [selectedId])
  const sheet = useAsync(loadSheet)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [opened, setOpened] = useState(null)

  const refresh = () => { ov.reload(); sheet.reload() }
  const submitted = (sheet.data?.rows ?? []).filter((r) => r.submission)
  const quick = () => {
    if (!submitted.some((r) => r.state === 'submitted')) return notify('Tidak ada berkas yang perlu diperiksa.', 'info')
    setFilter('ungraded'); setPage(1)
    setTimeout(() => { sheetRef.current?.scrollIntoView?.({ behavior: 'smooth' }); document.querySelector('[data-score-input]')?.focus() }, 0)
  }
  const error = classes.error || ov.error || sheet.error
  const busy = classes.loading || ov.loading || sheet.loading

  return (
    <div>
      <TopBar query={q} onQuery={(v) => { setQ(v); setPage(1) }} placeholder="Cari siswa" name={user.name} subtitle={`Guru ${teacherHome.subject} & Wali Kelas ${teacherHome.homeroom.name}`} />
      <div className="space-y-6">
        <section className="panel flex flex-wrap items-start justify-between gap-4">
          <div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700"><ClipboardCheck size={14} />Modul Penilaian & Umpan Balik</p>
            <h1 className="mt-1 max-w-xl text-2xl font-extrabold sm:text-3xl">Bank & Evaluasi Pengumpulan Tugas Siswa</h1></div>
          <div className="w-full space-y-3 sm:w-64">
            <select aria-label="Pilih kelas" className="w-full rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-medium" value={cid ?? ''} onChange={(e) => { setClassId(Number(e.target.value)); setFilter('all'); setPage(1) }}>
              {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} - {teacherHome.subject}</option>)}</select>
            <Link to="/teacher/assignments/new" className="btn-primary w-full"><Plus size={16} /> Buat Penugasan Baru</Link>
          </div>
        </section>
        {error ? <ErrorState message={error} onRetry={refresh} /> : busy || !ov.data ? <LoadingState /> : (
          <>
            <GradingStats active={ov.data.assignments.length} pending={ov.data.pending} onTimePct={ov.data.onTimePct} />
            <ActiveBanner assignments={ov.data.assignments} selectedId={selectedId} onSelect={(id) => { setChoice({ cid, id }); setFilter('all'); setPage(1) }} submitted={submitted.length} total={sheet.data?.rows.length ?? 0} onQuick={quick} />
            {sheet.data && <div ref={sheetRef}><SubmissionSheet rows={submitted} dueDate={sheet.data.assignment.dueDate} filter={filter} onFilter={(f) => { setFilter(f); setPage(1) }} q={q} page={page} onPage={setPage} onOpen={setOpened} onSaved={refresh}
              onZip={() => notify('Simulasi: berkas tidak tersimpan di server, ZIP tidak dapat dibuat.', 'info')} /></div>}
          </>
        )}
      </div>
      {opened && <GradeDialog row={opened} onClose={() => setOpened(null)} onSaved={() => { setOpened(null); refresh() }} />}
    </div>
  )
}

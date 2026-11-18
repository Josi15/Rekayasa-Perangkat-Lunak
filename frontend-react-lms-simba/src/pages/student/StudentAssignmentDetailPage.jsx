import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarClock, Loader2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import DownloadButton from '../../components/common/DownloadButton'
import AttachmentPicker from '../../components/forms/AttachmentPicker'
import TaskStatusBadge from '../../components/student/TaskStatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { studentService, serviceMode } from '../../services'
import { formatDateTime } from '../../utils/format'
import { taskState, isOpen, timeLeft } from '../../utils/student'

export default function StudentAssignmentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { notify } = useToast()
  const load = useCallback(() => studentService.getAssignment(user.id, id), [user.id, id])
  const { data: a, loading, error, reload } = useAsync(load)
  const [answer, setAnswer] = useState('')
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!a) return <ErrorState message="Tugas tidak tersedia." />
  const s = a.submission
  const st = taskState(a)
  const open = isOpen(st)

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await studentService.submit(user.id, a.id, { answer, attachments: files }); notify(serviceMode.mock ? 'Tugas dikirim (data simulasi).' : 'Tugas dikirim.', 'success'); reload() }
    catch (err) { notify(err.message, 'error') } finally { setSaving(false) }
  }
  return (
    <>
      <PageHeader title={a.title} description={`${a.subjectName} · ${a.className}`} breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Tugas', to: '/student/assignments' }, { label: a.title }]} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5 text-sm">
            <div className="mb-3"><TaskStatusBadge state={st} late={s?.late} /></div>
            <h2 className="mb-1 font-semibold text-slate-900">Instruksi pengerjaan</h2>
            <p className="whitespace-pre-wrap text-slate-700">{a.instructions || '(tanpa instruksi)'}</p>
            {a.attachments?.map((x) => <span key={x.name} className="mt-3 flex items-center gap-2 text-slate-700">{x.name}<DownloadButton attachment={x} /></span>)}
          </section>
          {s ? (
            <section className="card space-y-2 p-5 text-sm">
              <h2 className="font-semibold text-slate-900">Pengumpulan Anda</h2>
              <p className="text-slate-500">Dikumpulkan {formatDateTime(s.submittedAt)}</p>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{s.answer || '(tanpa teks)'}</p>
              {s.attachments?.map((x) => <span key={x.name} className="flex items-center gap-2">{x.name}<DownloadButton attachment={x} /></span>)}
            </section>
          ) : open ? (
            <form onSubmit={submit} className="card space-y-3 p-5 text-sm">
              <h2 className="font-semibold text-slate-900">Kirim tugas</h2>
              {st === 'overdue' && <p role="note" className="rounded-lg bg-red-50 p-3 text-red-700">Tenggat sudah lewat. Pengumpulan tetap dicoba dan akan ditandai terlambat bila diterima.</p>}
              <label htmlFor="answer" className="font-semibold">Jawaban</label>
              <textarea id="answer" rows={6} className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} />
              <AttachmentPicker value={files} onChange={setFiles} />
              <button className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Kumpulkan tugas</button>
            </form>
          ) : (
            <section className="card p-5 text-sm text-slate-600">Tugas ini sudah ditutup oleh guru dan tidak bisa dikumpulkan lagi.</section>
          )}
        </div>
        <aside className="space-y-4">
          <div className="card p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-slate-900"><CalendarClock size={16} className="text-brand-600" />Tenggat waktu</p>
            <p className="mt-1 text-slate-700">{formatDateTime(a.dueDate)}</p>
            {open && <p className={st === 'overdue' ? 'text-red-600' : 'text-amber-700'}>{timeLeft(a.dueDate)}</p>}
          </div>
          {s?.status === 'graded' && (
            <div className="rounded-card border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="text-2xl font-bold text-emerald-800">{s.score} <span className="text-base font-normal">/ 100</span></p>
              {s.feedback && <><p className="mt-2 font-medium text-slate-900">Feedback guru</p><p className="text-slate-700">{s.feedback}</p></>}
              {s.gradedAt && <p className="mt-2 text-xs text-slate-500">Dinilai {formatDateTime(s.gradedAt)}</p>}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

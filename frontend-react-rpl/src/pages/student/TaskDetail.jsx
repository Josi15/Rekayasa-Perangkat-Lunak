import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarClock, FileText } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { ConfirmationDialog } from '../../components/common/Modal.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import TextArea from '../../components/forms/TextArea.jsx'
import AttachmentPicker from '../../components/forms/AttachmentPicker.jsx'
import TaskStatusBadge from '../../components/student/TaskStatusBadge.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentTasks } from '../../services/index.js'
import { fmtDateTime, timeLeft } from '../../utils/date.js'
import { fmtSize, validateSubmission } from '../../utils/fileValidation.js'

export default function TaskDetail() {
  const { taskId } = useParams()
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentTasks.get(user.id, Number(taskId)), [user.id, taskId]))
  return <AsyncBoundary state={state}>{(t) => <Content key={t.id} initial={t} uid={user.id} />}</AsyncBoundary>
}

function Content({ initial, uid }) {
  const toast = useToast()
  const [task, setTask] = useState(initial)
  const [answer, setAnswer] = useState('')
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const open = task.status === 'todo' || task.status === 'overdue'

  const review = (e) => {
    e.preventDefault()
    const errs = validateSubmission({ answer, files })
    setErrors(errs)
    if (Object.keys(errs).length === 0) setConfirm(true)
  }
  const submit = async () => {
    setSaving(true)
    try {
      setTask(await studentTasks.submit(uid, task.id, { answer, attachments: files }))
      toast('Tugas berhasil dikumpulkan.')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
      setConfirm(false)
    }
  }

  return (
    <>
      <PageHeader title={task.title} breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Tugas', to: '/student/tasks' }, { label: task.title }]} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600"><TaskStatusBadge task={task} /><span>{task.courseName} · {task.teacher}</span></div>
            <p className="mt-3 text-slate-700">{task.description}</p>
            <h2 className="mb-2 mt-4 font-semibold text-slate-900">Instruksi pengerjaan</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">{task.instructions.map((i) => <li key={i}>{i}</li>)}</ol>
          </section>

          {open ? (
            <form onSubmit={review} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Jawaban Anda</h2>
              {task.status === 'overdue' && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Tenggat sudah lewat. Tugas masih dapat dikumpulkan dan akan ditandai terlambat.</p>}
              <TextArea label="Jawaban teks" rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} error={errors.answer} hint={`${answer.length}/5000`} />
              <AttachmentPicker files={files} onChange={setFiles} error={errors.files} />
              <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Kumpulkan tugas</button>
            </form>
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-semibold text-slate-900">Pengumpulan Anda</h2>
              <p className="text-sm text-slate-500">Dikumpulkan pada {fmtDateTime(task.submission.submittedAt)}</p>
              {task.submission.answer && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{task.submission.answer}</p>}
              {task.submission.attachments.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">{task.submission.attachments.map((f) => <li key={f.name} className="flex items-center gap-2"><FileText className="size-4 text-brand-600" />{f.name}<span className="text-xs text-slate-500">{fmtSize(f.size)}</span></li>)}</ul>
              )}
            </section>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <p className="flex items-center gap-2 font-semibold text-slate-900"><CalendarClock className="size-4 text-brand-600" />Tenggat waktu</p>
            <p className="mt-1 text-slate-700">{fmtDateTime(task.due)}</p>
            {open && <p className={task.status === 'overdue' ? 'text-red-600' : 'text-amber-700'}>{timeLeft(task.due)}</p>}
            <p className="mt-3 text-slate-500">Status: {{ todo: 'Belum dikerjakan', overdue: 'Belum dikumpulkan (terlambat)', submitted: 'Menunggu penilaian', graded: 'Sudah dinilai' }[task.status]}</p>
          </div>
          {task.status === 'graded' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="text-2xl font-bold text-emerald-800">{task.score}<span className="text-base font-normal">/{task.maxScore}</span></p>
              <p className="mt-2 font-medium text-slate-900">Feedback guru</p><p className="text-slate-700">{task.feedback}</p>
              <p className="mt-2 text-xs text-slate-500">Dinilai {fmtDateTime(task.gradedAt)}</p>
            </div>
          )}
        </aside>
      </div>
      <ConfirmationDialog open={confirm} tone="primary" title="Kumpulkan tugas?" confirmLabel={saving ? 'Mengirim...' : 'Ya, kumpulkan'}
        message="Setelah dikumpulkan, jawaban tidak dapat diubah. Pastikan jawaban dan lampiran sudah benar." onConfirm={submit} onCancel={() => !saving && setConfirm(false)} />
    </>
  )
}

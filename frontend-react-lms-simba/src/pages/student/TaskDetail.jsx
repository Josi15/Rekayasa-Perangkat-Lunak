import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarClock, Download, FileText, User } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { ConfirmationDialog } from '../../components/common/Modal.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import TextArea from '../../components/forms/TextArea.jsx'
import AttachmentPicker from '../../components/forms/AttachmentPicker.jsx'
import TaskStatusBadge from '../../components/student/TaskStatusBadge.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { Card, Eyebrow, FileTypeIcon, Pill } from '../../components/student/ui.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentTasks } from '../../services/index.js'
import { fmtDateTime, timeLeft } from '../../utils/date.js'
import { fmtSize, validateSubmission } from '../../utils/fileValidation.js'
import { btnPrimary, SIM_NOTE } from '../../utils/styles.js'

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
  const canSubmit = task.status === 'todo'
  const unfinished = task.status === 'todo' || task.status === 'overdue'

  const review = (e) => {
    e.preventDefault()
    const errs = validateSubmission({ answer, files })
    setErrors(errs)
    if (Object.keys(errs).length === 0) setConfirm(true)
  }
  const submit = async () => {
    setSaving(true)
    try { setTask(await studentTasks.submit(uid, task.id, { answer, attachments: files })); toast('Tugas berhasil dikumpulkan.') } catch (err) { toast(err.message, 'error') } finally { setSaving(false); setConfirm(false) }
  }

  return (
    <>
      <PageHeader title="" breadcrumb={[{ label: 'Tugas & Berkas', to: '/student/tasks' }, { label: task.title }]} />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2"><Pill>{unfinished ? 'Tugas Mandiri Aktif' : 'Tugas'}</Pill>{canSubmit && <Pill tone="red">Sisa {timeLeft(task.due)}</Pill>}</div>
            <h1 className="mt-3 text-xl font-extrabold text-slate-900">{task.title}</h1>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><span className="flex items-center gap-1"><User className="size-3.5" />{task.teacher}</span><span className="flex items-center gap-1 text-red-600"><CalendarClock className="size-3.5" />{fmtDateTime(task.due)}</span><TaskStatusBadge task={task} /></p>
            <p className="mt-3 text-sm text-slate-700">{task.description}</p>
            <div className="mt-4 rounded-xl bg-simba-bg p-4">
              <Eyebrow>Petunjuk pengerjaan & syarat kelulusan laporan</Eyebrow>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{task.instructions.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
            {task.supportFiles?.length > 0 && (
              <div className="mt-4"><Eyebrow>Materi & berkas penunjang guru</Eyebrow>
                {task.supportFiles.map((f) => <div key={f.name} className="flex items-center gap-3 rounded-xl border border-simba-line p-3 text-sm"><FileTypeIcon type={f.type} /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{f.name}</p><p className="text-xs text-slate-500">{f.type} • {f.size} • Diunggah {f.date}</p></div><button onClick={() => toast(SIM_NOTE)} className="flex items-center gap-1 text-xs font-semibold text-brand-600"><Download className="size-3.5" />Unduh Panduan</button></div>)}
              </div>
            )}
          </Card>
          {task.status === 'graded' && (
            <Card className="border-brand-100 bg-brand-50"><p className="text-3xl font-extrabold text-brand-700">{task.score}<span className="text-base font-normal">/{task.maxScore}</span></p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Feedback guru</p><p className="text-sm text-slate-700">{task.feedback}</p><p className="mt-1 text-xs text-slate-500">Dinilai {fmtDateTime(task.gradedAt)}</p></Card>
          )}
        </div>
        <div className="lg:col-span-2">
          {canSubmit ? (
            <form onSubmit={review} noValidate className="space-y-4 rounded-2xl border border-simba-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Unggah Lembar Jawaban</h2><Pill>Batas kirim aktif</Pill></div>
              <TextArea label="Jawaban teks" rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} error={errors.answer} hint={`${answer.length}/5000`} />
              <AttachmentPicker files={files} onChange={setFiles} error={errors.files} />
              <p className="rounded-xl bg-simba-bg p-3 text-xs text-slate-600">Anda masih dapat merevisi berkas sebelum tombol kirim ditekan. Setelah tenggat, tugas tidak dapat dikumpulkan.</p>
              <button className={`${btnPrimary} w-full`}>Kirim Tugas Sekarang</button>
            </form>
          ) : !task.submission ? (
            <Card className="border-red-200 bg-red-50 text-sm text-red-700"><h2 className="mb-1 font-bold">Batas waktu telah berakhir</h2>Tugas ini tidak dapat dikumpulkan lagi. Hubungi guru mata pelajaran jika ada kendala.</Card>
          ) : (
            <Card title="Pengumpulan Anda">
              <p className="text-xs text-slate-500">Terkumpul pada {fmtDateTime(task.submission.submittedAt)}</p>
              {task.submission.answer && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-simba-bg p-3 text-sm text-slate-700">{task.submission.answer}</p>}
              {task.submission.attachments.map((f) => <p key={f.name} className="mt-2 flex items-center gap-2 text-sm"><FileText className="size-4 text-brand-600" />{f.name}<span className="text-xs text-slate-500">{fmtSize(f.size)}</span></p>)}
            </Card>
          )}
        </div>
      </div>
      <ConfirmationDialog open={confirm} tone="primary" title="Kumpulkan tugas?" confirmLabel={saving ? 'Mengirim...' : 'Ya, kumpulkan'}
        message="Setelah dikumpulkan, jawaban tidak dapat diubah. Pastikan jawaban dan lampiran sudah benar." onConfirm={submit} onCancel={() => !saving && setConfirm(false)} />
    </>
  )
}

import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, Download, Eye, MessageSquare, Clock, User } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import { Card, Eyebrow, FileTypeIcon, Pill } from '../../components/student/ui.jsx'
import MaterialRow from '../../components/student/MaterialRow.jsx'
import ProgressBar from '../../components/student/ProgressBar.jsx'
import MessageTeacherModal from '../../components/student/MessageTeacherModal.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentAttendance, studentSchedule, studentService, studentTasks } from '../../services/index.js'
import { timeLeft } from '../../utils/date.js'
import { btnGhost, btnPrimary, SIM_NOTE } from '../../utils/styles.js'

const DAY = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

export default function ClassDetail() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const state = useAsync(useCallback(() => Promise.all([studentService.getCourse(user.id, Number(courseId)), studentTasks.list(user.id), studentSchedule.forCourse(user.id, Number(courseId))]), [user.id, courseId]))
  return <AsyncBoundary state={state}>{([c, tasks, sched]) => <Content c={c} tasks={tasks.filter((t) => t.courseId === c.id)} sched={sched} />}</AsyncBoundary>
}

function Content({ c, tasks, sched }) {
  const toast = useToast()
  const [msg, setMsg] = useState(false)
  const sim = () => toast(SIM_NOTE)
  const current = c.materials.find((m) => !m.done) ?? c.materials.at(-1)
  const files = c.materials.flatMap((m) => m.attachments.map((a) => ({ ...a, materialId: m.id })))
  const active = tasks.find((t) => t.status === 'todo')
  const graded = tasks.filter((t) => t.status === 'graded')
  const att = studentAttendance.courseSummary(c.id)
  const attPct = Math.round((att.present / att.total) * 100)

  return (
    <>
      <PageHeader title="" breadcrumb={[{ label: 'Kelas Saya', to: '/student/classes' }, { label: c.name }]} />
      <Card className="mb-5">
        <Pill>{c.category}</Pill>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{c.name} — Kelas XII</h1>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1"><User className="size-4" />{c.teacher}</span>
          {sched.length > 0 && <span className="flex items-center gap-1"><Clock className="size-4" />{sched.map((s) => `${DAY[s.day]} ${s.start} - ${s.end}`).join(' & ')} ({sched[0].room})</span>}
        </p>
        <p className="mt-2 text-sm text-slate-600">{c.description}</p>
        <div className="mt-3 max-w-md"><ProgressBar percent={c.percent} label={`${c.done} dari ${c.total} materi dipelajari`} /></div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {current && (
            <Card>
              <Eyebrow>Bab berjalan minggu ini</Eyebrow>
              <h2 className="text-xl font-bold text-slate-900">Bab {current.order} — {current.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{current.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Link to={`/student/materials/${current.id}`} className={btnPrimary}><BookOpen className="size-4" />Buka Materi</Link>
                {current.attachments.some((a) => a.type === 'MP4') && <Link to={`/student/materials/${current.id}`} className={btnGhost}>Tonton Video Praktikum</Link>}</div>
            </Card>
          )}
          <Card title="Daftar Materi" icon={BookOpen}>
            {c.materials.length === 0 ? <EmptyState title="Belum ada materi" /> : <div className="space-y-2">{c.materials.map((m) => <MaterialRow key={m.id} material={m} />)}</div>}
          </Card>
          <Card title="Daftar Berkas Materi Pembelajaran" action={files.length > 0 && <button onClick={sim} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"><Download className="size-3.5" />Unduh Semua (ZIP)</button>}>
            {files.length === 0 ? <EmptyState title="Belum ada berkas" /> : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-3 rounded-xl bg-simba-bg p-3 text-sm">
                    <FileTypeIcon type={f.type} /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{f.name}</p><p className="text-xs text-slate-500">{f.type} • {f.size}{f.date ? ` • Diunggah ${f.date}` : ''}</p></div>
                    <Link to={`/student/materials/${f.materialId}`} aria-label="Lihat materi" className="text-slate-500 hover:text-brand-600"><Eye className="size-4" /></Link>
                    <button onClick={sim} aria-label={`Unduh ${f.name}`} className="text-slate-500 hover:text-brand-600"><Download className="size-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Tugas Mandiri Aktif">
            {active ? (
              <>
                <b className="block text-slate-900">{active.title}</b><p className="mt-1 text-xs text-slate-600">{active.description}</p>
                <p className="mt-2 text-xs text-red-600">Sisa {timeLeft(active.due)}</p>
                <Link to={`/student/tasks/${active.id}`} className={`${btnPrimary} mt-3 w-full`}>Kirim Tugas Sekarang</Link>
              </>
            ) : <p className="text-sm text-slate-500">Tidak ada tugas aktif untuk mapel ini.</p>}
          </Card>
          <Card title="Statistik Belajar Anda">
            <p className="text-xs font-bold uppercase text-slate-500">Presensi mapel</p>
            <p className="text-3xl font-extrabold text-slate-900">{attPct}%</p><p className="text-xs text-slate-500">{att.present}/{att.total} pertemuan hadir</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {graded.length === 0 ? <li>Belum ada nilai.</li> : graded.map((t) => <li key={t.id} className="flex justify-between gap-2"><span>{t.title}</span><b>{t.score}/{t.maxScore}</b></li>)}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-simba-dark font-bold text-white">{c.teacher[0]}</span><div><b className="text-sm text-slate-900">Ibu/Bapak {c.teacher}</b><p className="text-xs text-slate-500">Guru pengampu {c.name}</p></div></div>
            <p className="mt-3 rounded-xl bg-simba-bg p-3 text-xs italic text-slate-600">&ldquo;Silakan ajukan pertanyaan pada forum diskusi atau hubungi melalui pesan LMS bila mengalami kesulitan materi.&rdquo;</p>
            <button onClick={() => setMsg(true)} className={`${btnGhost} mt-3 w-full`}><MessageSquare className="size-4" />Kirim Pesan</button>
          </Card>
        </div>
      </div>
      {msg && <MessageTeacherModal teacher={c.teacher} onClose={() => setMsg(false)} />}
    </>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Timer } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { ConfirmationDialog } from '../../components/common/Modal.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import { Card } from '../../components/student/ui.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentQuiz } from '../../services/index.js'
import { btnGhost, btnPrimary } from '../../utils/styles.js'

export default function QuizRunner() {
  const { quizId } = useParams()
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentQuiz.get(user.id, Number(quizId)), [user.id, quizId]))
  return <AsyncBoundary state={state}>{(q) => <Runner key={q.id} quiz={q} uid={user.id} />}</AsyncBoundary>
}

function Runner({ quiz, uid }) {
  const toast = useToast()
  const [answers, setAnswers] = useState({})
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(quiz.durationMin * 60)
  const [confirm, setConfirm] = useState(false)
  const [result, setResult] = useState(quiz.result)
  const answersRef = useRef(answers)
  const sending = useRef(false)

  useEffect(() => { answersRef.current = answers }, [answers])
  const finish = useCallback(async () => {
    if (sending.current) return
    sending.current = true
    try { setResult(await studentQuiz.submit(uid, quiz.id, answersRef.current)); toast('Jawaban kuis terkirim.') } catch (e) { toast(e.message, 'error'); sending.current = false }
    setConfirm(false)
  }, [uid, quiz.id, toast])
  const active = quiz.startable && !result
  useEffect(() => {
    if (!active) return undefined
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [active])
  useEffect(() => { if (active && left <= 0) finish() }, [active, left, finish])

  const crumbs = [{ label: 'Kuis CBT', to: '/student/quiz' }, { label: quiz.courseName }]
  if (result) {
    const pass = result.score >= quiz.kkm
    return (
      <>
        <PageHeader title="" breadcrumb={crumbs} />
        <Card className="mx-auto max-w-lg text-center">
          <p className="text-xs font-bold uppercase text-slate-500">Hasil kuis</p><h1 className="mt-1 text-lg font-bold text-slate-900">{quiz.title}</h1>
          <p className={`mt-4 text-6xl font-extrabold ${pass ? 'text-brand-700' : 'text-red-600'}`}>{result.score}</p>
          <p className="mt-1 text-sm text-slate-600">{result.correct} dari {result.total} soal benar · KKM {quiz.kkm} · {pass ? 'Memenuhi KKM' : 'Di bawah KKM'}</p>
          <Link to="/student/quiz" className={`${btnPrimary} mt-5`}>Kembali ke Kuis CBT</Link>
        </Card>
      </>
    )
  }
  if (!quiz.startable) {
    return (
      <>
        <PageHeader title="" breadcrumb={crumbs} />
        <Card className="mx-auto max-w-lg text-center"><h1 className="font-bold text-slate-900">Kuis tidak dapat dikerjakan</h1><p className="mt-2 text-sm text-slate-600">{quiz.expired ? 'Batas waktu kuis telah berakhir.' : 'Kuis ini belum dibuka.'}</p><Link to="/student/quiz" className={`${btnGhost} mt-4`}>Kembali</Link></Card>
      </>
    )
  }

  const q = quiz.questions[i]
  const unanswered = quiz.questions.length - Object.keys(answers).length
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0')
  const ss = String(Math.max(0, left % 60)).padStart(2, '0')
  return (
    <>
      <PageHeader title={quiz.title} breadcrumb={crumbs} actions={<span className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-sm font-bold ${left < 60 ? 'bg-red-50 text-red-700' : 'bg-white text-slate-800'}`}><Timer className="size-4" />{mm}:{ss}</span>} />
      <div className="grid gap-5 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <p className="text-xs font-bold uppercase text-slate-500">Soal {i + 1} dari {quiz.questions.length}</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{q.q}</h2>
          <div className="mt-4 space-y-2" role="radiogroup">
            {q.options.map((o, k) => (
              <label key={o} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${answers[i] === k ? 'border-brand-600 bg-brand-50' : 'border-simba-line hover:bg-simba-bg'}`}>
                <input type="radio" name={`q${i}`} checked={answers[i] === k} onChange={() => setAnswers({ ...answers, [i]: k })} className="accent-brand-600" />{o}
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-between gap-2">
            <button disabled={i === 0} onClick={() => setI(i - 1)} className={`${btnGhost} disabled:opacity-40`}>Sebelumnya</button>
            {i < quiz.questions.length - 1 ? <button onClick={() => setI(i + 1)} className={btnPrimary}>Berikutnya</button> : <button onClick={() => setConfirm(true)} className={btnPrimary}>Kirim jawaban</button>}
          </div>
        </Card>
        <Card title="Navigasi soal">
          <div className="grid grid-cols-5 gap-2">{quiz.questions.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Soal ${k + 1}`} className={`rounded-lg py-2 text-sm font-semibold ${k === i ? 'ring-2 ring-brand-600' : ''} ${answers[k] !== undefined ? 'bg-brand-600 text-white' : 'bg-simba-bg text-slate-600'}`}>{k + 1}</button>)}</div>
          <button onClick={() => setConfirm(true)} className={`${btnGhost} mt-4 w-full`}>Selesai & kirim</button>
        </Card>
      </div>
      <ConfirmationDialog open={confirm} tone="primary" title="Kirim jawaban kuis?" confirmLabel="Ya, kirim" message={unanswered > 0 ? `Masih ada ${unanswered} soal belum dijawab. Jawaban tidak dapat diubah setelah dikirim.` : 'Jawaban tidak dapat diubah setelah dikirim.'} onConfirm={finish} onCancel={() => setConfirm(false)} />
    </>
  )
}

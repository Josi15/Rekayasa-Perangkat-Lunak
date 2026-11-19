import { delay } from './api.js'
import * as d from '../data/student.js'
import { store } from './studentStore.js'

const KEY = (uid) => `simba_quiz_${uid}`
const KKM = 75
const course = (id) => d.courses.find((c) => c.id === id)

const strip = ({ questions, ...q }) => ({ ...q, courseName: course(q.courseId)?.name ?? '-', teacher: course(q.courseId)?.teacher ?? '-', totalQuestions: questions.length })

function overview(uid) {
  const results = store.get(KEY(uid), {})
  const now = new Date()
  const all = d.quizzes.map((q) => ({ ...strip(q), result: results[q.id] ?? null, expired: new Date(q.due) < now }))
  const done = Object.entries(results).map(([id, r]) => {
    const q = d.quizzes.find((x) => x.id === Number(id))
    return { id: `r${id}`, course: course(q.courseId).name, title: q.title, date: r.finishedAt, questions: r.total, score: r.score, kkm: KKM }
  })
  return {
    active: all.filter((q) => q.status === 'active' && !q.result),
    upcoming: all.filter((q) => q.status === 'upcoming'),
    history: [...done, ...d.quizHistory].sort((a, b) => new Date(b.date) - new Date(a.date)),
    kkm: KKM,
  }
}

export const studentQuiz = {
  overview: (uid) => delay(overview(uid)),
  async get(uid, id) {
    const q = d.quizzes.find((x) => x.id === id)
    if (!q) throw new Error('Kuis tidak ditemukan.')
    const result = store.get(KEY(uid), {})[id] ?? null
    const expired = new Date(q.due) < new Date()
    return delay({ ...strip(q), questions: q.questions.map(({ answer: _a, ...rest }) => rest), result, expired, startable: q.status === 'active' && !result && !expired, kkm: KKM })
  },
  async submit(uid, id, answers) {
    const q = d.quizzes.find((x) => x.id === id)
    if (!q) throw new Error('Kuis tidak ditemukan.')
    const results = store.get(KEY(uid), {})
    if (results[id]) throw new Error('Kuis ini sudah dikerjakan.')
    if (q.status !== 'active' || new Date(q.due) < new Date()) throw new Error('Batas waktu kuis telah berakhir.')
    const correct = q.questions.filter((x, i) => answers[i] === x.answer).length
    const result = { correct, total: q.questions.length, score: Math.round((correct / q.questions.length) * 100), finishedAt: new Date().toISOString() }
    results[id] = result
    store.set(KEY(uid), results)
    return delay(result)
  },
}

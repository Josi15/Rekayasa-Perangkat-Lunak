import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ProgressBar from '../../components/student/ProgressBar.jsx'
import MaterialBlocks from '../../components/student/MaterialBlocks.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentService } from '../../services/index.js'

export default function MaterialDetail() {
  const { materialId } = useParams()
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentService.getMaterial(user.id, Number(materialId)), [user.id, materialId]))
  return <AsyncBoundary state={state}>{(m) => <Content key={m.id} m={m} uid={user.id} />}</AsyncBoundary>
}

function Content({ m, uid }) {
  const toast = useToast()
  const [done, setDone] = useState(m.done)
  const [course, setCourse] = useState(m.course)
  const [saving, setSaving] = useState(false)

  const toggle = async () => {
    setSaving(true)
    try {
      const c = await studentService.setMaterialDone(uid, m.id, !done)
      setDone(!done)
      setCourse({ ...course, percent: c.percent, done: c.done })
      toast(!done ? 'Materi ditandai sudah dipelajari.' : 'Tanda dipelajari dihapus.')
    } catch {
      toast('Gagal menyimpan progres.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const nav = (mat, dir) => mat
    ? <Link to={`/student/materials/${mat.id}`} className={`flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-brand-500 ${dir === 'next' ? 'justify-end text-right' : ''}`}>
        {dir === 'prev' && <ChevronLeft className="size-4" />}<span><span className="block text-xs text-slate-500">{dir === 'prev' ? 'Sebelumnya' : 'Selanjutnya'}</span>{mat.title}</span>{dir === 'next' && <ChevronRight className="size-4" />}
      </Link>
    : <div className="flex-1" />

  return (
    <>
      <PageHeader title={m.title} breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Kelas Saya', to: '/student/classes' }, { label: course.name, to: `/student/classes/${course.id}` }, { label: m.title }]} />
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="flex items-center gap-3 text-sm text-slate-500"><span className="flex items-center gap-1"><Clock className="size-4" />{m.minutes} menit</span><span>Materi {m.index} dari {course.total}</span></p>
          <MaterialBlocks blocks={m.blocks} />
          <button onClick={toggle} disabled={saving} className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
            <CheckCircle2 className="size-4" />{done ? 'Sudah dipelajari (klik untuk batalkan)' : 'Tandai sudah dipelajari'}
          </button>
        </article>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><ProgressBar percent={course.percent} label={`Progres ${course.name}`} /></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold text-slate-900">Lampiran</h2>
            {m.attachments.length === 0 ? <p className="text-sm text-slate-500">Tidak ada lampiran.</p> : (
              <ul className="space-y-2 text-sm">
                {m.attachments.map((a) => <li key={a.name} className="flex items-center gap-2 text-slate-700"><FileText className="size-4 text-brand-600" /><span className="flex-1">{a.name}</span><span className="text-xs text-slate-500">{a.type} · {a.size}</span></li>)}
              </ul>
            )}
            {m.attachments.length > 0 && <p className="mt-2 text-xs text-slate-500">Unduhan berfungsi setelah backend terhubung.</p>}
          </div>
        </aside>
      </div>
      <div className="mt-6 flex gap-3">{nav(m.prev, 'prev')}{nav(m.next, 'next')}</div>
    </>
  )
}

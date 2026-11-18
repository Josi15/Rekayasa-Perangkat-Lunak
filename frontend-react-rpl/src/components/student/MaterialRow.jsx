import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Clock, Paperclip } from 'lucide-react'

export default function MaterialRow({ material, showCourse }) {
  return (
    <Link to={`/student/materials/${material.id}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-500">
      {material.done ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : <Circle className="size-5 shrink-0 text-slate-300" />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{material.title}</p>
        <p className="truncate text-xs text-slate-500">{showCourse ? `${material.courseName} · ` : ''}{material.done ? 'Sudah dipelajari' : 'Belum dipelajari'}</p>
      </div>
      {material.attachments?.length > 0 && <Paperclip className="size-4 text-slate-400" aria-label="Ada lampiran" />}
      <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="size-3.5" />{material.minutes} mnt</span>
    </Link>
  )
}

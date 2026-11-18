import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'
import CourseStatus from './CourseStatus.jsx'

export default function CourseCard({ course }) {
  return (
    <Link to={`/student/classes/${course.id}`} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{course.category}</span>
        <CourseStatus status={course.status} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{course.name}</h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><User className="size-4" />{course.teacher}</p>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{course.description}</p>
      <div className="mt-4"><ProgressBar percent={course.percent} label={`${course.done} dari ${course.total} materi`} /></div>
    </Link>
  )
}

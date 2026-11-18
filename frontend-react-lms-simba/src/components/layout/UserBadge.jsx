import { roleLabel } from '../../utils/format'

// Identitas pengguna (avatar inisial + nama + peran), seragam untuk semua peran.
export default function UserBadge({ user }) {
  return (
    <div className="flex items-center gap-3" aria-label="Pengguna aktif">
      <div className="hidden text-right text-xs sm:block"><p className="font-bold text-slate-900">{user.name}</p><p className="text-slate-600">{roleLabel[user.role]}</p></div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-700" aria-hidden="true">{user.name[0]}</span>
    </div>
  )
}

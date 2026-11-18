import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentNotices } from '../../services/index.js'
import { fmtDateTime } from '../../utils/date.js'

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const state = useAsync(useCallback(() => studentNotices.listNotifications(user.id), [user.id]))
  const open = async (n) => { await studentNotices.markRead(user.id, [n.id]); navigate(n.to) }
  const readAll = async () => { await studentNotices.markAllNotificationsRead(user.id); toast('Semua notifikasi ditandai dibaca.'); state.reload() }
  return (
    <>
      <PageHeader title="Notifikasi" breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Notifikasi' }]}
        actions={<button onClick={readAll} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Tandai semua dibaca</button>} />
      <AsyncBoundary state={state}>
        {(items) => items.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white"><EmptyState title="Belum ada notifikasi" /></div> : (
          <div className="space-y-2">
            {items.map((n) => (
              <button key={n.id} onClick={() => open(n)} className={`flex w-full gap-3 rounded-lg border p-3 text-left hover:border-brand-500 ${n.read ? 'border-slate-200 bg-white' : 'border-brand-100 bg-brand-50/50'}`}>
                <span className={`mt-2 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand-600'}`} />
                <span><b className="block text-slate-900">{n.title}</b><span className="text-sm text-slate-600">{n.text}</span><span className="block text-xs text-slate-400">{fmtDateTime(n.at)}</span></span>
              </button>
            ))}
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}

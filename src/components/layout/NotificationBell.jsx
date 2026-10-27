import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { studentNotices } from '../../services/index.js'
import { fmtDateTime } from '../../utils/date.js'

export default function NotificationBell({ uid }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const load = useCallback(() => studentNotices.listNotifications(uid).then(setItems).catch(() => setItems([])), [uid])

  useEffect(() => {
    load()
    window.addEventListener('simba:notices', load)
    return () => window.removeEventListener('simba:notices', load)
  }, [load])
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const unread = items.filter((n) => !n.read).length
  const go = async (n) => { setOpen(false); await studentNotices.markRead(uid, [n.id]); navigate(n.to) }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2 hover:bg-slate-100" aria-label={`Notifikasi, ${unread} belum dibaca`}>
        <Bell className="size-5 text-slate-600" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg">
          <p className="border-b border-slate-100 px-4 py-2 text-sm font-semibold">Notifikasi</p>
          {items.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-500">Belum ada notifikasi.</p> : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {items.slice(0, 5).map((n) => (
                <li key={n.id}><button onClick={() => go(n)} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/50'}`}>
                  <b className="block text-slate-900">{n.title}</b><span className="text-slate-600">{n.text}</span><span className="block text-xs text-slate-400">{fmtDateTime(n.at)}</span>
                </button></li>
              ))}
            </ul>
          )}
          <Link to="/student/notifications" onClick={() => setOpen(false)} className="block border-t border-slate-100 px-4 py-2 text-center text-sm text-brand-600 hover:bg-slate-50">Lihat semua</Link>
        </div>
      )}
    </div>
  )
}

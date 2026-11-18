import { Link } from 'react-router-dom'

export default function TodayAgenda({ agenda }) {
  return (
    <section className="panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-xl font-bold">Agenda Mengajar Hari Ini</h2><p className="text-sm text-slate-500">Total {agenda.length} sesi tatap muka terjadwal</p></div>
        <Link to="/teacher/schedule" className="text-sm font-semibold text-brand-700 hover:underline">Lihat Jadwal Lengkap</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-brand-50 text-slate-700"><tr>{['Jam', 'Kelas & Rombel', 'Materi Pembahasan', 'Ruang / Tempat', 'Status'].map((h, i) => <th key={h} className={`px-4 py-3 font-semibold ${i === 4 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody>
            {agenda.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className={`px-4 py-4 ${r.status === 'running' ? 'font-bold text-brand-700' : 'text-slate-600'}`}>{r.time}</td>
                <td className="px-4 py-4 font-bold">{r.className}</td>
                <td className="px-4 py-4 text-slate-600">{r.topic}</td>
                <td className="px-4 py-4 text-slate-600">{r.room}</td>
                <td className="px-4 py-4 text-right"><span className={`rounded px-2.5 py-1 text-xs font-semibold ${r.status === 'running' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{r.status === 'running' ? 'Berjalan' : 'Mendatang'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

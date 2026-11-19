import { Link } from 'react-router-dom'

function Page({ code, title, text }) {
  return (
    <div className="grid min-h-screen place-items-center p-4 text-center font-sans">
      <div>
        <p className="text-6xl font-bold text-brand-600">{code}</p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-slate-500">{text}</p>
        <Link to="/" className="mt-5 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">Ke beranda</Link>
      </div>
    </div>
  )
}
export function Forbidden() { return <Page code="403" title="Akses ditolak" text="Anda tidak memiliki izin untuk membuka halaman ini." /> }
export function NotFound() { return <Page code="404" title="Halaman tidak ditemukan" text="Alamat yang Anda tuju tidak tersedia." /> }

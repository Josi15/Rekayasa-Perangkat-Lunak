// Tes UI lintas peran: login/logout, 403/404, admin → siswa (data bersama), halaman siswa.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'

const admin = { id: 1, name: 'Admin Simba', role: 'admin', status: 'active' }
const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
const student = { id: 3, name: 'Andi Pratama', role: 'student', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)

function go(path, user) {
  localStorage.clear()
  if (user) localStorage.setItem('simba_mock_session', JSON.stringify(user))
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}
const loginHeading = () => screen.findByRole('heading', { name: 'Masuk' }, T)

test('akses: tanpa sesi → login; lintas peran → 403; rute tak dikenal → 404', async () => {
  let v = go('/student/dashboard')
  await loginHeading(); v.unmount()
  v = go('/admin/users', student)
  await find('Akses ditolak'); v.unmount()
  v = go('/student/grades', teacher)
  await find('Akses ditolak'); v.unmount()
  v = go('/student/tidak-ada', student)
  await find('Halaman tidak ditemukan')
}, 30000)

test('login demo: isi otomatis → dashboard sesuai peran → keluar menghapus sesi', async () => {
  const user = userEvent.setup()
  go('/login')
  await loginHeading()
  await user.click(screen.getByRole('button', { name: /^Guru/ }))
  expect(screen.getByLabelText('Kata sandi')).toHaveValue('guru123')
  await user.click(screen.getByRole('button', { name: 'Masuk' }))
  const nav = await screen.findByRole('navigation', { name: 'Menu utama' }, T)
  expect(within(nav).getByText('Presensi KBM')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Keluar/ }))
  await user.click(within(screen.getByRole('dialog')).getByText('Keluar'))
  await loginHeading()
  expect(localStorage.getItem('simba_mock_session')).toBeNull()
}, 30000)

test('login: kata sandi salah ditolak dengan pesan', async () => {
  const user = userEvent.setup()
  go('/login')
  await user.type(await screen.findByLabelText('Username, email, NISN, atau NIP', {}, T), 'siswa')
  await user.type(screen.getByLabelText('Kata sandi'), 'salahsalah')
  await user.click(screen.getByRole('button', { name: 'Masuk' }))
  expect(await screen.findByRole('alert', {}, T)).toHaveTextContent('salah')
}, 30000)

test('admin menambah pengguna & menonaktifkan siswa; pengaruhnya terlihat di login', async () => {
  const user = userEvent.setup()
  let v = go('/admin/users', admin)
  await user.click(await screen.findByRole('button', { name: /Tambah pengguna/ }, T))
  await user.type(screen.getByLabelText('Nama'), 'Rani Uji')
  await user.type(screen.getByLabelText('Email'), 'rani@simba.test')
  await user.type(screen.getByLabelText('Username'), 'rani')
  await user.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await find('Pengguna ditambahkan (simulasi).')).toBeInTheDocument()
  const search = await screen.findByLabelText('Cari nama, email, username', {}, T)
  await user.type(search, 'Rani')
  await find('Rani Uji')
  await user.clear(search); await user.type(search, 'Siti')
  await user.click(await screen.findByLabelText('Nonaktifkan Siti Nurhaliza', {}, T))
  await user.click(within(screen.getByRole('dialog')).getByText('Nonaktifkan'))
  expect(await find('Akun dinonaktifkan.')).toBeInTheDocument()
  v.unmount()

  go('/login')
  await user.type(await screen.findByLabelText('Username, email, NISN, atau NIP', {}, T), 'siti')
  await user.type(screen.getByLabelText('Kata sandi'), 'siswa123')
  await user.click(screen.getByRole('button', { name: 'Masuk' }))
  expect(await screen.findByRole('alert', {}, T)).toHaveTextContent('tidak aktif')
}, 60000)

test('pengumuman dibuat admin tampil di halaman siswa', async () => {
  const user = userEvent.setup()
  let v = go('/admin/announcements', admin)
  await user.click(await screen.findByRole('button', { name: /Buat pengumuman/ }, T))
  await user.type(screen.getByLabelText('Judul'), 'Libur Nasional')
  await user.type(screen.getByLabelText('Isi pengumuman'), 'Sekolah libur.')
  await user.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await find('Pengumuman dibuat (simulasi).')).toBeInTheDocument()
  v.unmount()
  go('/student/announcements', student)
  expect(await find('Libur Nasional')).toBeInTheDocument()
  expect(screen.queryByText('Rapat Dewan Guru')).not.toBeInTheDocument() // sasaran guru
}, 60000)

test('siswa: mapel, materi (hanya yang dipublikasikan), detail materi, dan jadwal', async () => {
  const user = userEvent.setup()
  let v = go('/student/subjects', student)
  await find('Matematika'); v.unmount()
  v = go('/student/materials', student)
  await user.click(await find('Fungsi Kuadrat'))
  expect(await screen.findByText(/Grafiknya berupa parabola/, {}, T)).toBeInTheDocument()
  v.unmount()
  v = go('/student/materials', student)
  await find('Fungsi Kuadrat')
  expect(screen.queryByText('Slide PPT Bab 2 - Limit Fungsi')).not.toBeInTheDocument() // draft
  v.unmount()
  go('/student/schedule', student)
  expect(await find('Bahasa Indonesia')).toBeInTheDocument()
  expect((await screen.findAllByText('Matematika', {}, T)).length).toBeGreaterThan(0)
}, 60000)

// Tahap 5B (mode mock): 5 halaman admin baru + restyle Pengguna/Kelas/Mapel/Pengumuman.
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { dayKey } from '../services/api/adapt'

const admin = { id: 1, name: 'Admin Simba', role: 'admin', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)
const heading = (name) => screen.findByRole('heading', { name }, T)

function go(path) {
  localStorage.clear()
  localStorage.setItem('simba_mock_session', JSON.stringify(admin))
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}
const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

test('jadwal: buat sesi, tolak bentrok kelas, lalu hapus', async () => {
  const user = userEvent.setup()
  go('/admin/schedule')
  await heading('Jadwal & Kalender KBM')
  expect(await find('Sesi pekan ini')).toBeInTheDocument()
  expect(await find('Deteksi bentrok')).toBeInTheDocument()

  const add = async (start, end) => {
    await user.click(screen.getByRole('button', { name: /Buat sesi baru/ }))
    await user.selectOptions(screen.getByLabelText('Kelas'), 'X IPA 1')
    await user.selectOptions(screen.getByLabelText('Mata pelajaran'), 'Matematika')
    fill('Tanggal', dayKey()); fill('Jam mulai', start); fill('Jam selesai', end)
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
  }
  await add('04:00', '05:00')
  expect(await find('Sesi ditambahkan (simulasi).')).toBeInTheDocument()
  const edit = await screen.findByLabelText('Ubah sesi Matematika X IPA 1 04:00', {}, T)
  expect(edit).toBeInTheDocument()

  await add('04:30', '05:30') // tumpang tindih dengan sesi di atas
  expect(await screen.findByRole('alert', {}, T)).toHaveTextContent('Bentrok')
  await user.click(screen.getByRole('button', { name: 'Batal' }))

  await user.click(screen.getByLabelText('Hapus sesi Matematika X IPA 1 04:00'))
  await user.click(within(screen.getByRole('dialog')).getByText('Hapus'))
  expect(await find('Sesi dihapus (simulasi).')).toBeInTheDocument()
  expect(screen.queryByLabelText('Ubah sesi Matematika X IPA 1 04:00')).not.toBeInTheDocument()
}, 40000)

test('jadwal: jam selesai sebelum jam mulai ditolak', async () => {
  const user = userEvent.setup()
  go('/admin/schedule')
  await heading('Jadwal & Kalender KBM')
  await find('Sesi pekan ini')
  await user.click(screen.getByRole('button', { name: /Buat sesi baru/ }))
  await user.selectOptions(screen.getByLabelText('Kelas'), 'X IPA 1')
  await user.selectOptions(screen.getByLabelText('Mata pelajaran'), 'Matematika')
  fill('Jam mulai', '10:00'); fill('Jam selesai', '09:00')
  await user.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByRole('alert', {}, T)).toHaveTextContent('Jam selesai harus setelah jam mulai')
}, 30000)

test('materi, tugas & nilai, dan kuis: tampil baca-saja dengan data', async () => {
  let v = go('/admin/materials')
  await heading('Materi & Silabus Satdik')
  expect(await find('Total materi')).toBeInTheDocument()
  expect(await find('Fungsi Kuadrat')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Unggah|Tambah/ })).not.toBeInTheDocument()
  v.unmount()

  v = go('/admin/assignments')
  await heading('Bank Tugas & Evaluasi')
  expect(await find('Total tugas')).toBeInTheDocument()
  expect(await find('Nilai Terbaru')).toBeInTheDocument()
  v.unmount()

  go('/admin/quiz')
  await heading('Kuis Form & CBT')
  expect(await find('Total kuis')).toBeInTheDocument()
  expect(await find('Kuis Form Bab 3 Fungsi Eksponen')).toBeInTheDocument()
}, 40000)

test('presensi: lihat sesi pada tanggal tertentu dan koreksi status siswa', async () => {
  const user = userEvent.setup()
  go('/admin/attendance')
  await heading('Monitoring Presensi')
  expect(await find('Rekap per Siswa')).toBeInTheDocument()
  fill('Tanggal sesi', '2026-11-16') // Senin: Matematika X IPA 1 07:30
  await user.click(await screen.findByLabelText('Lihat presensi Matematika X IPA 1 07:30', {}, T))
  const dialog = await screen.findByRole('dialog', {}, T)
  const select = await within(dialog).findByLabelText('Status Raditya Pratama', {}, T)
  expect(select).toHaveValue('H')
  await user.selectOptions(select, 'I')
  expect(await find('Presensi Raditya Pratama dikoreksi (simulasi).')).toBeInTheDocument()
  expect(await within(dialog).findByLabelText('Status Raditya Pratama', {}, T)).toHaveValue('I')
}, 40000)

test('halaman master yang di-restyle: kartu ringkasan + tabel; aksi lama tetap ada', async () => {
  let v = go('/admin/users')
  await heading('Manajemen Pengguna')
  expect(await find('Total akun')).toBeInTheDocument()
  expect(await screen.findByLabelText('Cari nama, email, username', {}, T)).toBeInTheDocument()
  v.unmount()
  v = go('/admin/classes')
  await heading('Kelas & Rombel')
  expect(await find('Total rombel')).toBeInTheDocument()
  expect(await find('X IPA 1')).toBeInTheDocument()
  v.unmount()
  v = go('/admin/subjects')
  await heading('Mata Pelajaran & Kurikulum')
  expect(await find('Total mapel')).toBeInTheDocument()
  v.unmount()
  go('/admin/announcements')
  await heading('Pengumuman')
  expect(await find('Total pengumuman')).toBeInTheDocument()
  expect(await find('Ujian Tengah Semester')).toBeInTheDocument()
}, 60000)

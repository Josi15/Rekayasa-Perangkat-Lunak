import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { toCsv } from '../utils/csv'

const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
const student = { id: 3, name: 'Andi Pratama', role: 'student', status: 'active' }
const go = (user, path) => {
  localStorage.setItem('simba_mock_session', JSON.stringify(user))
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)

test('alur: guru buat tugas → siswa lihat & kumpul → guru nilai → siswa lihat nilai', async () => {
  const user = userEvent.setup()
  // 1. guru membuat tugas
  let view = go(teacher, '/teacher/assignments/new')
  await screen.findByLabelText('Judul', {}, T)
  await user.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('Judul wajib diisi.')).toBeInTheDocument()
  expect(screen.getByText('Tenggat wajib diisi.')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Judul'), 'Kuis Alur Uji')
  await user.type(screen.getByLabelText('Instruksi'), 'Kerjakan nomor 1-5.')
  await user.selectOptions(screen.getByLabelText('Kelas'), 'X IPA 1')
  fireEvent.change(screen.getByLabelText('Tenggat waktu'), { target: { value: '2026-12-31T23:59' } })
  await user.selectOptions(screen.getByLabelText('Status'), 'published')
  await user.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText(/Tugas dibuat/, {}, T)).toBeInTheDocument()
  await find('Kuis Alur Uji')
  view.unmount()

  // 2-3. siswa melihat tugas lalu mengumpulkan
  view = go(student, '/student/assignments')
  await user.click(await find('Kuis Alur Uji'))
  await user.click(await screen.findByRole('button', { name: 'Kumpulkan tugas' }, T)) // kosong → ditolak
  expect(await screen.findByText('Isi jawaban atau pilih lampiran.', {}, T)).toBeInTheDocument()
  await user.type(screen.getByLabelText('Jawaban'), 'Jawaban saya: 42')
  await user.click(screen.getByRole('button', { name: 'Kumpulkan tugas' }))
  expect(await screen.findByText(/Tugas dikirim/, {}, T)).toBeInTheDocument()
  await find('Jawaban saya: 42')
  view.unmount()

  // 4-5. guru melihat pengumpulan, validasi rentang, menilai, mengedit dengan konfirmasi
  view = go(teacher, '/teacher/assignments/manage')
  const li = (await find('Kuis Alur Uji')).closest('li')
  expect(li).toHaveTextContent('1/2 terkumpul')
  await user.click(within(li).getByLabelText('Detail'))
  await find('Pengumpulan siswa')
  const rowOf = (n) => screen.getByText(n).closest('tr')
  expect(rowOf('Siti Nurhaliza')).toHaveTextContent('Belum mengumpulkan')
  await user.selectOptions(screen.getByLabelText('Filter pengumpulan'), 'missing')
  expect(screen.queryByText('Andi Pratama')).not.toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Filter pengumpulan'), 'all')
  await user.click(within(rowOf('Andi Pratama')).getByText('Nilai'))
  await find('Jawaban saya: 42')
  await user.type(screen.getByLabelText('Nilai (0–100)'), '150')
  await user.click(screen.getByRole('button', { name: 'Simpan nilai' }))
  expect(await screen.findByText('Nilai harus antara 0 dan 100.')).toBeInTheDocument()
  await user.clear(screen.getByLabelText('Nilai (0–100)'))
  await user.type(screen.getByLabelText('Nilai (0–100)'), '90')
  await user.type(screen.getByLabelText('Feedback'), 'Kerja bagus')
  await user.click(screen.getByRole('button', { name: 'Simpan nilai' }))
  await waitFor(() => expect(rowOf('Andi Pratama')).toHaveTextContent('Sudah dinilai'), T)
  await user.click(within(rowOf('Andi Pratama')).getByText('Edit nilai'))
  const score = await screen.findByLabelText('Nilai (0–100)', {}, T)
  await user.clear(score); await user.type(score, '95')
  await user.click(screen.getByRole('button', { name: 'Ubah nilai' }))
  await user.click(await find('Ya, ubah'))
  await waitFor(() => expect(rowOf('Andi Pratama')).toHaveTextContent('95'), T)
  view.unmount()

  // 6. siswa melihat nilai
  view = go(student, '/student/grades')
  await find('Kuis Alur Uji')
  expect(screen.getByText('95')).toBeInTheDocument()
  expect(screen.getByText('Kerja bagus')).toBeInTheDocument()
  view.unmount()

  // rekap nilai: 85 (seed) + 95
  go(teacher, '/teacher/grading/recap')
  await find('Rata-rata')
  expect(screen.getByText('Rata-rata').parentElement).toHaveTextContent('90')
  expect(screen.getByText('Tertinggi').parentElement).toHaveTextContent('95')
  await user.selectOptions(screen.getByLabelText('Filter tugas'), 'Kuis Alur Uji')
  expect(screen.getByText('Rata-rata').parentElement).toHaveTextContent('95')
}, 60000)

test('arsipkan, publikasikan, dan hapus tugas dengan konfirmasi', async () => {
  const user = userEvent.setup()
  go(teacher, '/teacher/assignments/manage')
  const li = () => screen.getByText('Kuis Persamaan Linear').closest('li')
  await find('Kuis Persamaan Linear')
  await user.click(within(li()).getByLabelText('Arsipkan'))
  await waitFor(() => expect(li()).toHaveTextContent('Diarsipkan'), T)
  await user.selectOptions(screen.getByLabelText('Filter status'), 'published')
  expect(screen.queryByText('Kuis Persamaan Linear')).not.toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Filter status'), 'all')
  await user.click(within(li()).getByLabelText('Hapus'))
  await user.click(screen.getByText('Batal'))
  expect(screen.getByText('Kuis Persamaan Linear')).toBeInTheDocument()
  await user.click(within(li()).getByLabelText('Hapus'))
  await user.click(within(screen.getByRole('dialog')).getByText('Hapus'))
  await waitFor(() => expect(screen.queryByText('Kuis Persamaan Linear')).not.toBeInTheDocument(), T)
}, 30000)

test('CSV: escape koma dan tanda kutip', () => {
  expect(toCsv([{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }], [{ a: 'x,y', b: 'say "hi"' }])).toBe('A,B\n"x,y","say ""hi"""')
})

test('jadwal: matriks sesuai desain, turunan data, cetak, dan reservasi lab', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-20T07:30:00')) // Selasa, Jam 1-2
  const user = userEvent.setup()
  go(teacher, '/teacher/schedule')
  await screen.findByText('Matriks Mingguan KBM (Senin - Jumat)', {}, T)
  expect(screen.getAllByText('Berlangsung')).toHaveLength(1)
  expect(screen.getByLabelText('hari ini').parentElement).toHaveTextContent('Selasa')
  expect(screen.getByText('Beban Ajar Mingguan').parentElement).toHaveTextContent('28 / 24')
  expect(screen.getByText('4 Kelas')).toBeInTheDocument()
  window.print = vi.fn()
  await user.click(screen.getByText('Unduh Jadwal (PDF)'))
  expect(window.print).toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Reservasi Jadwal Lab' }))
  await user.click(screen.getByText('Kirim permintaan'))
  expect(await screen.findByText('Pilih lab.')).toBeInTheDocument()
  expect(screen.getByText('Keperluan wajib diisi.')).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Lab'), 'Laboratorium Komputer 1')
  await user.selectOptions(screen.getByLabelText('Slot jam'), 's2')
  await user.type(screen.getByLabelText('Keperluan'), 'Praktikum GeoGebra')
  await user.click(screen.getByText('Kirim permintaan'))
  expect(await screen.findByText(/Permintaan reservasi dicatat/)).toBeInTheDocument()
  vi.useRealTimers()
})


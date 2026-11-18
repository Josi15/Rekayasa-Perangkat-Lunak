import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { lateHours } from '../utils/format'

const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)
function go(path) {
  localStorage.setItem('simba_mock_session', JSON.stringify(teacher))
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}

test('format: jam keterlambatan dibulatkan ke atas', () => {
  expect(lateHours('2026-10-20T01:15', '2026-10-19T23:59')).toBe(2)
  expect(lateHours('2026-10-19T10:00', '2026-10-19T23:59')).toBe(0)
})

test('bank tugas (desain 4): statistik turunan, filter, nilai inline, konfirmasi ubah, ganti kelas', async () => {
  const user = userEvent.setup()
  go('/teacher/assignments')
  await find('Latihan Fungsi Kuadrat')
  await find('Menampilkan 1-2 dari 2 berkas siswa terkumpul')
  expect(screen.getByText('Penugasan').parentElement).toHaveTextContent('1')
  expect(screen.getByText('Berkas Masuk').parentElement).toHaveTextContent('1')
  expect(screen.getByText('Rata-rata Kelas').parentElement).toHaveTextContent('100%')
  expect(screen.getByText('Menampilkan 1-2 dari 2 berkas siswa terkumpul')).toBeInTheDocument()
  expect(screen.getByText('2 / 2 Siswa')).toBeInTheDocument()
  expect(screen.getByLabelText('Nilai Siti Nurhaliza')).toHaveValue(85)

  // pencarian (top bar) dan filter
  await user.type(screen.getByLabelText('Cari siswa'), 'siti')
  expect(screen.queryByLabelText('Nilai Andi Pratama')).not.toBeInTheDocument()
  await user.clear(screen.getByLabelText('Cari siswa'))
  await user.click(screen.getByText('Belum Diperiksa (1)'))
  expect(screen.queryByLabelText('Nilai Siti Nurhaliza')).not.toBeInTheDocument()

  // koreksi cepat memfokuskan nilai pertama yang belum diperiksa
  await user.click(screen.getByText('Mulai Koreksi Cepat'))
  await waitFor(() => expect(screen.getByLabelText('Nilai Andi Pratama')).toHaveFocus())

  // validasi rentang lalu simpan
  const score = screen.getByLabelText('Nilai Andi Pratama')
  const save = screen.getByLabelText('Simpan nilai Andi Pratama')
  expect(save).toBeDisabled()
  await user.type(score, '150'); await user.click(save)
  expect(await screen.findByText('Nilai harus antara 0 dan 100.')).toBeInTheDocument()
  await user.clear(score); await user.type(score, '88')
  await user.type(screen.getByLabelText('Umpan balik Andi Pratama'), 'Mantap')
  await user.click(save)
  expect(await screen.findByText(/Nilai disimpan/, {}, T)).toBeInTheDocument()
  await find('Belum Diperiksa (0)')
  expect(screen.getByText('Berkas Masuk').parentElement).toHaveTextContent('0')

  // ubah nilai yang sudah ada → konfirmasi (batal dulu)
  await user.click(screen.getByText('Semua (2)'))
  const siti = screen.getByLabelText('Nilai Siti Nurhaliza')
  await user.clear(siti); await user.type(siti, '90')
  await user.click(screen.getByLabelText('Simpan nilai Siti Nurhaliza'))
  await user.click(await find('Batal'))
  expect(screen.getByLabelText('Nilai Siti Nurhaliza')).toHaveValue(90)
  await user.click(screen.getByLabelText('Simpan nilai Siti Nurhaliza'))
  await user.click(await find('Ya, ubah'))
  await waitFor(() => expect(screen.getByLabelText('Nilai Siti Nurhaliza')).toHaveValue(90), T)

  // buka berkas/jawaban, zip simulasi
  await user.click(screen.getByLabelText('Buka berkas Andi Pratama'))
  await find('Jawaban Andi Pratama')
  await user.click(within(screen.getByRole('dialog')).getByText('Tutup'))
  await user.click(screen.getByText('Unduh Semua Zip'))
  expect(await find('Simulasi: berkas tidak tersimpan di server, ZIP tidak dapat dibuat.')).toBeInTheDocument()

  // ganti kelas
  await user.selectOptions(screen.getByLabelText('Pilih kelas'), 'X IPS 2 - Matematika')
  await find('Kuis Persamaan Linear')
  expect(screen.getByText('Berkas Masuk').parentElement).toHaveTextContent('1')
  expect(await screen.findByLabelText('Nilai Dewi Lestari', {}, T)).toBeInTheDocument()
}, 60000)

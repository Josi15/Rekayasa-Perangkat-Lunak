import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { attendanceService } from '../services'

const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)
const go = (path) => { localStorage.setItem('simba_mock_session', JSON.stringify(teacher)); return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>) }
const box = (label) => screen.getByText(label).parentElement

test('presensi (desain 5): statistik, status, cari, tandai hadir, catatan, tutup/buka sesi, jurnal, cetak', async () => {
  const user = userEvent.setup()
  go('/teacher/attendance')
  await find('Raditya Pratama')
  expect(box('Roster Kelas')).toHaveTextContent('32')
  expect(box('Hadir')).toHaveTextContent('30 (93.8%)')
  expect(box('Izin Resmi')).toHaveTextContent('1')
  expect(screen.getByText('Menampilkan 1-8 dari 32 siswa')).toBeInTheDocument()
  expect(screen.getByText('Surat Sakit Terlampir (PDF)')).toBeInTheDocument()

  await user.click(screen.getByLabelText('Raditya Pratama: Sakit'))
  await waitFor(() => expect(box('Sakit')).toHaveTextContent('2'), T)
  expect(box('Hadir')).toHaveTextContent('29')
  await user.click(screen.getByLabelText('Raditya Pratama: Alpha'))
  await waitFor(() => expect(box('Tanpa Ket. (Alpha)')).toHaveTextContent('1'), T)
  await user.click(screen.getByText('Tandai Semua Hadir'))
  expect(await find('1 siswa ditandai hadir (simulasi).')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByLabelText('Raditya Pratama: Hadir')).toHaveAttribute('aria-pressed', 'true'), T)
  expect(screen.getAllByText('Manual Guru').length).toBeGreaterThan(0)

  const search = screen.getByLabelText('Cari nama / NISN')
  await user.type(search, 'Daffa')
  expect(screen.queryByText('Raditya Pratama')).not.toBeInTheDocument()
  await user.clear(search); await user.type(search, '0061245908')
  expect(screen.getByText('Fatimah Zahra Wardani')).toBeInTheDocument()
  await user.clear(search)

  const note = screen.getByLabelText('Catatan Nabila Dwi Ananda')
  await user.clear(note); await user.type(note, 'Izin ke toilet'); await user.tab()
  await waitFor(async () => expect((await attendanceService.get()).records[1].note).toBe('Izin ke toilet'), T)

  await user.click(screen.getByText('Tutup Sesi Presensi'))
  await user.click(await find('Ya, tutup'))
  await find('Sesi Ditutup')
  expect(screen.getByLabelText('Raditya Pratama: Sakit')).toBeDisabled()
  expect(screen.getByText('Tandai Semua Hadir').closest('button')).toBeDisabled()
  await user.click(screen.getByText('Buka Kembali Sesi'))
  await find('Sesi Berlangsung Sekarang')
  expect(screen.getByLabelText('Raditya Pratama: Sakit')).toBeEnabled()

  await user.click(screen.getByText('Riwayat Jurnal Sesi'))
  const dlg = screen.getByRole('dialog')
  expect(within(dlg).getByText(/Hari ini — Jam 3-4/)).toBeInTheDocument()
  expect(within(dlg).getByText(/14 Okt 2026/)).toBeInTheDocument()
  await user.click(within(dlg).getByText('Tutup'))
  window.print = vi.fn()
  await user.click(screen.getByText('Cetak Berita Acara (PDF)'))
  expect(window.print).toHaveBeenCalled()

  await user.click(screen.getByLabelText('Raditya Pratama: Sakit'))
  await waitFor(() => expect(box('Sakit')).toHaveTextContent('2'), T)
}, 90000)

test('dashboard membaca data presensi bersama', async () => {
  go('/teacher/dashboard')
  await find('Panel Wali Kelas')
  expect(screen.getByText('90.6% Hadir')).toBeInTheDocument()
  expect(screen.getByText('Sakit').parentElement).toHaveTextContent('2')
})

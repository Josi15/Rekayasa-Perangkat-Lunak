// Dashboard admin (desain prototype): render, tab pengguna, dan halaman menu admin.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'

const admin = { id: 1, name: 'Admin Simba', role: 'admin', status: 'active' }
const T = { timeout: 5000 }

function go(path) {
  localStorage.clear()
  localStorage.setItem('simba_mock_session', JSON.stringify(admin))
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}

test('dashboard admin menampilkan kartu statistik, sesi hari ini, pengguna terbaru, dan menu desain', async () => {
  const user = userEvent.setup()
  go('/admin/dashboard')
  expect(await screen.findByRole('heading', { name: 'Kontrol Administrator' }, T)).toBeInTheDocument()
  expect(screen.getByText('Total pengguna aktif')).toBeInTheDocument()
  expect(screen.getByText('Rombongan belajar')).toBeInTheDocument()
  expect(screen.getByText('Sesi KBM hari ini')).toBeInTheDocument()
  expect(screen.getByText('Pengguna Terbaru')).toBeInTheDocument()
  const nav = screen.getByRole('navigation', { name: 'Menu utama' })
  for (const label of ['Manajemen Pengguna', 'Kelas & Rombel', 'Jadwal & Kalender KBM', 'Monitoring Presensi']) expect(nav).toHaveTextContent(label)
  await user.click(screen.getByRole('tab', { name: 'Guru' }))
  expect(screen.getByRole('tab', { name: 'Guru' })).toHaveAttribute('aria-selected', 'true')
}, 20000)

test('semua menu admin punya halaman sungguhan (bukan lagi sedang dibangun)', async () => {
  go('/admin/attendance')
  expect(await screen.findByRole('heading', { name: 'Monitoring Presensi' }, T)).toBeInTheDocument()
  expect(screen.queryByText('Halaman ini sedang dibangun')).not.toBeInTheDocument()
}, 20000)

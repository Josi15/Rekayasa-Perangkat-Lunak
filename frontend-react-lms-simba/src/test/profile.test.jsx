import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { describeDevice } from '../utils/device'

const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)
const go = (path) => { localStorage.setItem('simba_mock_session', JSON.stringify(teacher)); return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>) }

test('deskripsi perangkat dari user agent', () => {
  expect(describeDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36')).toBe('Chrome di Windows 10/11')
  expect(describeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17 Safari/604')).toBe('Safari di iOS')
  expect(describeDevice('')).toBe('Browser di perangkat ini')
})

test('profil (desain 8): ringkasan SK, validasi, simpan + sinkron nama, foto, 2FA, sesi, kata sandi, cetak', async () => {
  const user = userEvent.setup()
  go('/teacher/profile')
  await screen.findByRole('heading', { name: 'Bu Ratna Wulandari' }, T)
  expect(screen.getByText('Total Beban Mengajar').parentElement).toHaveTextContent('28')
  expect(screen.getByRole('img', { name: '117%' })).toBeInTheDocument()
  expect(screen.getByText('X IPA 1 (32 Siswa)')).toBeInTheDocument()
  expect(screen.getByLabelText('Nomor Induk Pegawai (NIP)')).toBeDisabled()
  expect(screen.getByLabelText('NUPTK Nasional')).toBeDisabled()

  await user.click(screen.getByRole('button', { name: /Keamanan Akun & Sandi/ }))
  expect(screen.getByRole('button', { name: /Keamanan Akun & Sandi/ })).toHaveAttribute('aria-current', 'page')

  // validasi form
  const name = screen.getByLabelText('Nama Lengkap & Gelar Resmi'), email = screen.getByLabelText('Email Resmi Sekolah'), phone = screen.getByLabelText('Nomor WhatsApp Aktif')
  await user.clear(name); await user.clear(email); await user.clear(phone); await user.type(email, 'salah'); await user.type(phone, '123')
  await user.click(screen.getByText('Perbarui Data Profil'))
  expect(await screen.findByText(/Nama lengkap wajib diisi/)).toBeInTheDocument()
  expect(screen.getByText('Email tidak valid.')).toBeInTheDocument()
  expect(screen.getByText(/Nomor WhatsApp tidak valid/)).toBeInTheDocument()

  // simpan lewat tombol di header → nama ikut berubah di header & top bar
  await user.type(name, 'Ratna Wulandari, S.Pd.')
  await user.clear(email); await user.type(email, 'ratna@sman1.sch.id')
  await user.clear(phone); await user.type(phone, '+62 812-9843-2210')
  await user.click(screen.getByText('Simpan Perubahan'))
  expect(await screen.findByText(/Profil diperbarui/, {}, T)).toBeInTheDocument()
  await screen.findByRole('heading', { name: 'Ratna Wulandari, S.Pd.' }, T)
  expect(screen.getAllByText('Ratna Wulandari, S.Pd.').length).toBeGreaterThanOrEqual(2)
  expect(JSON.parse(localStorage.getItem('simba_mock_session')).name).toBe('Ratna Wulandari, S.Pd.')

  // foto: tipe salah ditolak, png diterima
  await user.upload(screen.getByLabelText('Ubah foto profil'), new File(['x'], 'a.gif', { type: 'image/gif' }))
  expect(await screen.findByText('Foto harus PNG, JPG, atau WEBP.')).toBeInTheDocument()
  await user.upload(screen.getByLabelText('Ubah foto profil'), new File(['x'], 'a.png', { type: 'image/png' }))
  expect(await screen.findByAltText('Foto profil', {}, T)).toBeInTheDocument()

  // 2FA: nonaktif butuh konfirmasi, aktif langsung
  const sw = screen.getByRole('switch')
  expect(sw).toHaveAttribute('aria-checked', 'true')
  await user.click(sw)
  await user.click(await find('Ya, nonaktifkan'))
  await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'), T)
  await user.click(screen.getByRole('switch'))
  await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'), T)

  // sesi lain
  expect(screen.getByText('Safari di iPhone')).toBeInTheDocument()
  await user.click(screen.getByText('Keluar Sesi Lain'))
  await user.click(await find('Ya, keluar'))
  await waitFor(() => expect(screen.queryByText('Safari di iPhone')).not.toBeInTheDocument(), T)
  expect(screen.getByText('Keluar Sesi Lain').closest('button')).toBeDisabled()

  // kata sandi (simulasi)
  await user.click(screen.getByText('Ubah Kata Sandi'))
  const dlg = screen.getByRole('dialog')
  await user.click(within(dlg).getByText('Simpan kata sandi'))
  expect(await screen.findByText('Kata sandi baru minimal 10 karakter.')).toBeInTheDocument()
  await user.type(within(dlg).getByLabelText('Kata sandi saat ini'), 'salah')
  await user.type(within(dlg).getByLabelText('Kata sandi baru'), 'PasswordBaru1')
  await user.type(within(dlg).getByLabelText('Konfirmasi kata sandi baru'), 'PasswordBaru1')
  await user.click(within(dlg).getByText('Simpan kata sandi'))
  expect(await find('Kata sandi saat ini salah.')).toBeInTheDocument()
  await user.clear(within(dlg).getByLabelText('Kata sandi saat ini')); await user.type(within(dlg).getByLabelText('Kata sandi saat ini'), 'guru123')
  await user.click(within(dlg).getByText('Simpan kata sandi'))
  expect(await screen.findByText(/kata sandi TIDAK diubah di server/, {}, T)).toBeInTheDocument()

  window.print = vi.fn()
  await user.click(screen.getByText('Cetak Lembar PTK'))
  expect(window.print).toHaveBeenCalled()
  await user.click(screen.getByText('Lihat Jadwal Mengajar & Rombel Lengkap'))
  expect(await find('Jadwal Mengajar & Agenda KBM')).toBeInTheDocument()
}, 90000)

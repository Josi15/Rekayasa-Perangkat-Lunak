import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'

const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)
const go = (path) => { localStorage.setItem('simba_mock_session', JSON.stringify(teacher)); return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>) }
const row = (title) => screen.getAllByText(title).map((e) => e.closest('tr')).find(Boolean)
const tab = (name) => screen.getByRole('button', { name })

test('kuis CBT (desain 6): statistik, tab, kelas, salin, sinkron, buat/tautkan, aksi baris, token', async () => {
  const user = userEvent.setup()
  go('/teacher/quiz')
  await screen.findAllByText('Kuis Form Bab 3 Fungsi Eksponen', {}, T)
  expect(screen.getByText('Kuis Aktif Berjalan').parentElement).toHaveTextContent('2')
  expect(screen.getByText('Total Siswa Mengerjakan').parentElement).toHaveTextContent('51 / 62')
  expect(screen.getByText('Rerata Nilai Asesmen').parentElement).toHaveTextContent('86.5')
  expect(tab('Semua Kuis (4)')).toBeInTheDocument()
  expect(tab('Kuis Berlangsung (1)')).toBeInTheDocument()
  expect(tab('Terjadwal (2)')).toBeInTheDocument()
  expect(tab('Riwayat Selesai (1)')).toBeInTheDocument()
  expect(screen.getAllByText('Kuis Form Bab 3 Fungsi Eksponen')).toHaveLength(2) // kartu unggulan + tabel

  await user.click(tab('Terjadwal (2)'))
  expect(screen.getByText('Kuis Harian Trigonometri Dasar')).toBeInTheDocument()
  expect(screen.queryByText('Pre-Test Aturan Pangkat & Logaritma')).not.toBeInTheDocument()
  await user.click(tab('Semua Kuis (4)'))
  await user.selectOptions(screen.getByLabelText('Filter kelas'), 'Semua Kelas')
  expect(tab('Semua Kuis (6)')).toBeInTheDocument()
  expect(screen.getByText('Latihan Soal Olimpiade Matematika')).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Filter kelas'), 'X IPA 1 (Matematika)')

  // salin tautan, respon, sinkron
  await user.click(screen.getByLabelText('Salin tautan'))
  expect(await find('Tautan form disalin.')).toBeInTheDocument()
  expect(await navigator.clipboard.readText()).toContain('docs.google.com/forms')
  await user.click(screen.getByText('Respon Siswa'))
  const dlg = screen.getByRole('dialog')
  expect(within(dlg).getByText('30 / 32')).toBeInTheDocument()
  await user.click(within(dlg).getByText('Tutup'))
  await user.click(screen.getByText('Tarik Nilai Otomatis ke Leger'))
  expect(await screen.findByText(/disinkronkan ke Leger \(simulasi\)/, {}, T)).toBeInTheDocument()
  await waitFor(() => expect(row('Kuis Form Bab 3 Fungsi Eksponen')).toHaveTextContent('Tersinkron'), T)

  // buat kuis (engine): validasi lalu sukses
  await user.click(screen.getByText('Buat Kuis Baru'))
  await user.click(screen.getByRole('button', { name: 'Buat Kuis' }))
  expect(await screen.findByText('Judul kuis wajib diisi.')).toBeInTheDocument()
  expect(screen.getByText('Pilih kelas sasaran.')).toBeInTheDocument()
  expect(screen.getByText('Durasi 5–300 menit.')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Judul kuis'), 'Kuis Uji Baru')
  await user.selectOptions(screen.getByLabelText('Kelas sasaran'), 'X IPA 1')
  await user.type(screen.getByLabelText('Jumlah soal'), '10')
  await user.type(screen.getByLabelText('Durasi (menit)'), '20')
  fireEvent.change(screen.getByLabelText('Batas waktu'), { target: { value: '2026-12-01T10:00' } })
  await user.click(screen.getByRole('button', { name: 'Buat Kuis' }))
  expect(await screen.findByText('Kuis dibuat (simulasi).', {}, T)).toBeInTheDocument()
  await waitFor(() => expect(tab('Semua Kuis (5)')).toBeInTheDocument(), T)

  // tautkan Google Form: URL tidak valid ditolak
  await user.click(screen.getByText('Tautkan Google Form Baru'))
  await user.type(screen.getByLabelText('Tautan Google Form'), 'https://contoh.com/form')
  await user.click(screen.getByRole('button', { name: 'Tautkan Form' }))
  expect(await screen.findByText(/tautan Google Form yang valid/)).toBeInTheDocument()
  await user.click(screen.getByText('Batal'))

  // aksi baris: mulai → akhiri → CSV → hapus
  const menu = (title, item) => user.click(within(row(title)).getByLabelText(`Aksi ${title}`)).then(() => user.click(screen.getByRole('menuitem', { name: item })))
  await menu('Kuis Uji Baru', 'Mulai Sekarang')
  await waitFor(() => expect(tab('Kuis Berlangsung (2)')).toBeInTheDocument(), T)
  await menu('Kuis Uji Baru', 'Akhiri Kuis')
  await waitFor(() => expect(tab('Riwayat Selesai (2)')).toBeInTheDocument(), T)
  URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn(); HTMLAnchorElement.prototype.click = vi.fn()
  await menu('Kuis Uji Baru', 'Unduh Rekap (CSV)')
  expect(URL.createObjectURL).toHaveBeenCalled()
  await menu('Kuis Uji Baru', 'Hapus')
  await user.click(screen.getByText('Batal'))
  expect(screen.getByText('Kuis Uji Baru')).toBeInTheDocument()
  await menu('Kuis Uji Baru', 'Hapus')
  await user.click(within(screen.getByRole('dialog')).getByText('Hapus'))
  await waitFor(() => expect(screen.queryByText('Kuis Uji Baru')).not.toBeInTheDocument(), T)

  // token darurat & dokumentasi
  const before = screen.getByTestId('token').textContent
  expect(before).toBe('MTK-7829')
  await user.click(screen.getByText('Generate Token Baru'))
  await waitFor(() => expect(screen.getByTestId('token').textContent).not.toBe(before), T)
  expect(screen.getByTestId('token').textContent).toMatch(/^MTK-\d{4}$/)
  await user.click(screen.getByText('Pelajari dokumentasi lengkap →'))
  expect(screen.getByText(/belum tersedia pada fase frontend/)).toBeInTheDocument()
}, 90000)

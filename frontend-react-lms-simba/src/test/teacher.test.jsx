import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'

const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
function renderAt(path) {
  localStorage.setItem('simba_mock_session', JSON.stringify(teacher))
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, { timeout: 5000 })

test('dashboard sesuai desain: antrean & pengumpulan terbaru dari data bersama', async () => {
  const user = userEvent.setup()
  renderAt('/teacher/dashboard')
  await find('Antrean Evaluasi')
  expect(screen.getByText('Berkas Masuk').parentElement).toHaveTextContent('2')
  expect(screen.getByText('Dewi Lestari')).toBeInTheDocument()
  expect(screen.getByText('Panel Wali Kelas')).toBeInTheDocument()
  expect(screen.getByText('93.8% Hadir')).toBeInTheDocument()
  expect(screen.getAllByText('Mendatang')).toHaveLength(2)
  await user.click(screen.getByText('Mulai Sesi Google Form'))
  expect(await screen.findByText(/integrasi Google Form belum tersedia/)).toBeInTheDocument()
  await user.click(screen.getByText('Periksa Sekarang'))
  expect(await screen.findByRole('heading', { name: 'Bank & Evaluasi Pengumpulan Tugas Siswa' }, { timeout: 5000 })).toBeInTheDocument()
})

test('kelas: filter status dan detail', async () => {
  const user = userEvent.setup()
  renderAt('/teacher/classes')
  await find('XI IPA 1')
  await user.selectOptions(screen.getByLabelText('Filter status'), 'finished')
  expect(screen.queryByText('X IPA 1')).not.toBeInTheDocument()
  await user.click(screen.getByText('XI IPA 1'))
  await find('Siswa (1)')
})

test('materi (desain 3): statistik, tab, cari, paginasi, unggah cepat, edit, hapus & hapus massal', async () => {
  const user = userEvent.setup()
  renderAt('/teacher/materials')
  await find('Bab 3 - Fungsi Eksponen & Logaritma')
  expect(screen.getByText('Total Materi Terbit').parentElement).toHaveTextContent('6')
  expect(screen.getByText('Draf Modul').parentElement).toHaveTextContent('2')
  expect(screen.getByText('Siswa Terjangkau').parentElement).toHaveTextContent('3')
  expect(screen.getByText('Menampilkan 1-5 dari 8 berkas modul materi')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /Slide PPT/ }))
  expect(screen.getByText('Slide PPT Bab 4 - Trigonometri Dasar')).toBeInTheDocument()
  expect(screen.queryByText('Modul Ajar Bab 1 - Barisan & Deret')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Semua Materi/ }))
  await user.click(screen.getByLabelText('Halaman 2'))
  expect(screen.getByText('SOP & Keselamatan Kerja Lab Komputer')).toBeInTheDocument()

  const search = screen.getByLabelText('Cari materi')
  await user.type(search, 'limit')
  expect(screen.getByText('Slide PPT Bab 2 - Limit Fungsi')).toBeInTheDocument()
  expect(screen.queryByText('Bab 3 - Fungsi Eksponen & Logaritma')).not.toBeInTheDocument()
  await user.clear(search)

  // unggah cepat: validasi, file tidak valid, sukses
  await user.click(screen.getByRole('button', { name: 'Unggah & Rilis Modul' }))
  expect(await screen.findByText('Pilih berkas modul.')).toBeInTheDocument()
  expect(screen.getByText('Judul materi wajib diisi.')).toBeInTheDocument()
  expect(screen.getByText('Pilih kelas sasaran.')).toBeInTheDocument()
  await user.upload(screen.getByLabelText('Pilih berkas modul'), new File(['x'], 'virus.exe'))
  expect(screen.getByText(/format tidak didukung/)).toBeInTheDocument()
  await user.upload(screen.getByLabelText('Pilih berkas modul'), new File(['x'.repeat(2048)], 'bab5.pdf'))
  await user.type(screen.getByLabelText('Judul Materi / Bab'), 'Bab 5 - Matriks')
  await user.selectOptions(screen.getByLabelText('Target Kelas Rombel'), 'X IPA 1')
  await user.click(screen.getByRole('button', { name: 'Unggah & Rilis Modul' }))
  expect(await screen.findByText(/Modul dirilis \(simulasi\)/, {}, T)).toBeInTheDocument()
  await user.type(search, 'Matriks')
  const row = (await find('Bab 5 - Matriks')).closest('tr')
  expect(row).toHaveTextContent('PDF • 2 KB')
  expect(row).toHaveTextContent('Dipublikasikan')

  // edit
  await user.click(within(row).getByLabelText('Edit'))
  const title = await screen.findByLabelText('Judul', {}, T)
  await waitFor(() => expect(title).toHaveValue('Bab 5 - Matriks'))
  await user.clear(title); await user.type(title, 'Bab 5 - Matriks Dasar')
  await user.click(screen.getByRole('button', { name: 'Simpan' }))
  await user.type(await screen.findByLabelText('Cari materi', {}, T), 'Matriks Dasar')
  const row2 = (await find('Bab 5 - Matriks Dasar')).closest('tr')

  // hapus satu (batal lalu konfirmasi)
  await user.click(within(row2).getByLabelText('Hapus'))
  await user.click(screen.getByText('Batal'))
  expect(screen.getByText('Bab 5 - Matriks Dasar')).toBeInTheDocument()
  await user.click(within(row2).getByLabelText('Hapus'))
  await user.click(within(screen.getByRole('dialog')).getByText('Hapus'))
  await waitFor(() => expect(screen.queryByText('Bab 5 - Matriks Dasar')).not.toBeInTheDocument(), T)

  // hapus massal
  await user.clear(screen.getByLabelText('Cari materi'))
  await user.click(await screen.findByLabelText('Pilih Bab 3 - Fungsi Eksponen & Logaritma', {}, T))
  expect(screen.getByText('1 dipilih')).toBeInTheDocument()
  await user.click(screen.getByText('Hapus terpilih'))
  await user.click(within(screen.getByRole('dialog')).getByText('Hapus'))
  await waitFor(() => expect(screen.queryByText('Bab 3 - Fungsi Eksponen & Logaritma')).not.toBeInTheDocument(), T)
}, 60000)


test('detail materi menampilkan pratinjau dan lampiran simulasi', async () => {
  renderAt('/teacher/materials/1')
  await find('Pratinjau isi materi')
  expect(screen.getByText('fungsi-kuadrat.pdf')).toBeInTheDocument()
  expect(screen.getByText(/tidak tersimpan di server/)).toBeInTheDocument()
})

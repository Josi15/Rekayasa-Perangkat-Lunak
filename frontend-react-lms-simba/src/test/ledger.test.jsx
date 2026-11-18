import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { ledgerService, quizService, teacherAssignmentService } from '../services'
import { computeNA, predikatOf, summarize } from '../data/ledger'
import { buildLedgerXlsx } from '../utils/ledgerXlsx'

const teacher = { id: 2, name: 'Bu Ratna Wulandari', role: 'teacher', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)
const go = (path) => { localStorage.setItem('simba_mock_session', JSON.stringify(teacher)); return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>) }
const row = (name) => screen.getAllByText(name).map((e) => e.closest('tr')).find(Boolean)
const pts = (name) => screen.getByLabelText(`Skor PTS ${name}`)

test('rumus leger sesuai desain: bobot 30/30/40, predikat, ringkasan', () => {
  expect(computeNA(95, 97, 97)).toBe(96.4)
  expect(computeNA(90, 92, 91)).toBe(91.0)
  expect(computeNA(92, 89, 90)).toBe(90.3)
  expect(predikatOf(90)).toBe('A'); expect(predikatOf(89.9)).toBe('B'); expect(predikatOf(75)).toBe('B'); expect(predikatOf(74.9)).toBe('-')
  expect(summarize([{ na: 80, name: 'a', nisn: '1' }, { na: 70, name: 'b', nisn: '2' }])).toMatchObject({ avg: 75, tuntas: 1, tuntasPct: 50 })
})

test('berkas xlsx valid (zip) dengan baris siswa', async () => {
  const buf = await buildLedgerXlsx([{ no: 1, nisn: '001', name: 'A', tugas: 90, cbt: 90, pts: 90, na: 90, predikat: 'A', tuntas: true }], { className: 'X IPA 1', term: 'Ganjil 2026/2027', kktp: 75, formula: 'NA' })
  const bytes = new Uint8Array(buf)
  expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b])
})

test('buku nilai (desain 6): statistik, cari, edit PTS, validasi, simpan, tarik CBT, kunci, ekspor', async () => {
  const user = userEvent.setup()
  go('/teacher/grading')
  await screen.findAllByText('Raditya Pratama', {}, T)
  expect(screen.getByText('Skor Tertinggi Siswa').parentElement).toHaveTextContent('96.4')
  expect(screen.getByText('Ketuntasan Siswa').parentElement).toHaveTextContent('100%')
  expect(screen.getByText('Menampilkan 1-8 dari 32 siswa aktif di kelas X IPA 1')).toBeInTheDocument()
  expect(screen.getByText(/Rata Tugas × 30%\) \+ \(Rata Kuis CBT × 30%\) \+ \(Skor PTS × 40%\)/)).toBeInTheDocument()
  expect(screen.getByText(/Belum ditarik dari CBT/)).toBeInTheDocument()

  const search = screen.getByLabelText('Cari nama atau NISN')
  await user.type(search, '0061245908')
  expect(screen.getByText('Fatimah Zahra Wardani')).toBeInTheDocument()
  expect(screen.queryByLabelText('Skor PTS Raditya Pratama')).not.toBeInTheDocument()
  await user.clear(search)

  // PTS 40 → NA 73.6, belum tuntas, ringkasan ikut berubah (pratinjau langsung)
  fireEvent.change(pts('Raditya Pratama'), { target: { value: '40' } })
  expect(row('Raditya Pratama')).toHaveTextContent('73.6')
  expect(row('Raditya Pratama')).toHaveTextContent('Belum Tuntas')
  expect(screen.getByText('Ketuntasan Siswa').parentElement).toHaveTextContent('96.9%')
  expect(screen.getByText('31 dari 32 Siswa Tuntas')).toBeInTheDocument()

  // nilai di luar rentang ditolak
  fireEvent.change(pts('Nabila Dwi Ananda'), { target: { value: '150' } })
  expect(pts('Nabila Dwi Ananda')).toHaveAttribute('aria-invalid', 'true')
  await user.click(screen.getByText('Simpan Draf Leger'))
  expect(await find('Perbaiki skor PTS yang tidak valid (0–100).')).toBeInTheDocument()
  fireEvent.change(pts('Nabila Dwi Ananda'), { target: { value: '97' } }) // kembali ke nilai awal
  await user.click(screen.getByText('Simpan Draf Leger'))
  expect(await find('Draf leger disimpan (simulasi).')).toBeInTheDocument()
  await waitFor(async () => expect((await ledgerService.get()).rows[0].pts).toBe(40), T)

  // tarik nilai CBT → status data & tanda sinkron di modul kuis
  await user.click(screen.getByText('Tarik Nilai Kuis Form CBT'))
  expect(await screen.findByText(/kuis disinkronkan ke leger \(simulasi\)/, {}, T)).toBeInTheDocument()
  expect(await screen.findByText(/Tersinkron CBT \(Baru saja\)/, {}, T)).toBeInTheDocument()
  const quizzes = (await quizService.list()).quizzes
  expect(quizzes.find((x) => x.id === 1).syncedAt).toBeTruthy()

  // kunci → input terkunci → buka kunci
  await user.click(screen.getByText('Kunci & Kirim Nilai ke Buku Induk Rapor'))
  await user.click(await find('Ya, kunci'))
  await find('Buka Kunci Leger')
  expect(pts('Raditya Pratama')).toBeDisabled()
  expect(screen.getByText(/Validasi Guru Pengampu: Terkunci/)).toBeInTheDocument()
  await user.click(screen.getByText('Buka Kunci Leger'))
  await waitFor(() => expect(pts('Raditya Pratama')).toBeEnabled(), T)

  // ekspor xlsx
  URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn(); HTMLAnchorElement.prototype.click = vi.fn()
  await user.click(screen.getByText('Ekspor Leger Excel (.XLSX)'))
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled(), { timeout: 10000 })

  // tautan ke rekap per tugas
  await user.click(screen.getByText('Rekap per tugas →'))
  expect(await screen.findByText('Rekap Nilai', { selector: 'h1' }, T)).toBeInTheDocument()
}, 90000)

test('Rata Tugas leger diturunkan dari nilai tugas yang diberikan guru', async () => {
  const before = (await ledgerService.get()).rows.find((r) => r.name === 'Andi Pratama')
  await teacherAssignmentService.grade(1, { score: 70, feedback: 'ok' })
  const after = (await ledgerService.get()).rows.find((r) => r.name === 'Andi Pratama')
  expect(after.tugas).toBe(70)
  expect(after.tugas).not.toBe(before.tugas)
})

// Tahap 5C: halaman siswa bergaya desain frontend-react-rpl. Mode mock (data simulasi) + satu tes mode API (fetch = stub).
import { afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { taskState, timeLeft, nextSession, average } from '../utils/student'

const student = { id: 3, name: 'Andi Pratama', role: 'student', status: 'active' }
const T = { timeout: 5000 }
const find = (t) => screen.findByText(t, {}, T)

function go(path) {
  localStorage.clear()
  localStorage.setItem('simba_mock_session', JSON.stringify(student))
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}

test('pembantu: status tugas, sisa waktu, jadwal berikutnya, rata-rata', () => {
  const now = new Date('2026-11-11T10:00:00').getTime() // Rabu
  expect(taskState({ state: 'graded' }, now)).toBe('graded')
  expect(taskState({ state: 'submitted' }, now)).toBe('submitted')
  expect(taskState({ state: 'missing', status: 'archived', dueDate: '2026-12-01T10:00' }, now)).toBe('closed')
  expect(taskState({ state: 'missing', status: 'published', dueDate: '2026-11-10T10:00' }, now)).toBe('overdue')
  expect(taskState({ state: 'missing', status: 'published', dueDate: '2026-11-12T10:00' }, now)).toBe('todo')

  expect(timeLeft(now + 3 * 36e5, now)).toBe('3 jam lagi')
  expect(timeLeft(now + 10 * 6e4, now)).toBe('10 menit lagi')
  expect(timeLeft(now - 2 * 864e5, now)).toBe('terlambat 2 hari')

  const list = [{ id: 1, dayIndex: 1, time: '07:30', endTime: '09:00' }, { id: 2, dayIndex: 4, time: '13:00' }]
  expect(nextSession(list, new Date('2026-11-11T10:00:00'))).toMatchObject({ id: 2, live: false }) // Rabu → Kamis 13:00
  expect(nextSession(list, new Date('2026-11-12T13:30:00'))).toMatchObject({ id: 2, live: true }) // Kamis, sedang berlangsung (90 mnt)
  const wrap = nextSession(list, new Date('2026-11-12T14:45:00')) // Kamis selesai → Senin berikutnya
  expect(wrap.id).toBe(1)
  expect(wrap.when.getDay()).toBe(1)
  expect(nextSession([], new Date())).toBeNull()

  expect(average([85, 90])).toBe(87.5)
  expect(average([])).toBeNull()
})

test('dashboard: sapaan, ringkasan, tugas, jadwal, dan pengumuman khusus siswa', async () => {
  go('/student/dashboard')
  expect(await screen.findByRole('heading', { name: 'Halo, Andi!' }, T)).toBeInTheDocument()
  expect(await find('Tugas belum dikumpulkan')).toBeInTheDocument()
  expect(screen.getByText('Menunggu penilaian')).toBeInTheDocument() // 1 tugas dikumpulkan, belum dinilai
  expect(screen.getByText('Tidak ada tugas tertunda.')).toBeInTheDocument()
  expect(screen.getByText(/^Pelajaran berikutnya:/)).toBeInTheDocument()
  const news = screen.getByRole('region', { name: 'Pengumuman terbaru' })
  expect(within(news).getByText('Ujian Tengah Semester')).toBeInTheDocument()
  expect(within(news).queryByText('Rapat Dewan Guru')).not.toBeInTheDocument() // sasaran guru
  expect(within(news).getByRole('link', { name: /Ujian Tengah Semester/ })).toHaveAttribute('href', '/student/announcements/1')
}, 30000)

test('tugas: chip filter berjumlah, pencarian, dan keadaan kosong', async () => {
  const user = userEvent.setup()
  go('/student/assignments')
  expect(await find('Latihan Fungsi Kuadrat')).toBeInTheDocument()
  const chip = (name) => screen.getByRole('button', { name })
  expect(chip(/^Semua/)).toHaveAttribute('aria-pressed', 'true')
  await user.click(chip(/^Terlambat/))
  expect(await find('Tugas tidak ditemukan')).toBeInTheDocument()
  await user.click(chip(/^Menunggu penilaian/))
  expect(await find('Latihan Fungsi Kuadrat')).toBeInTheDocument()
  await user.click(chip(/^Semua/))
  await user.type(screen.getByLabelText('Cari tugas atau mapel'), 'zzz')
  expect(await find('Tugas tidak ditemukan')).toBeInTheDocument()
}, 30000)

test('nilai: belum ada nilai, tugas menunggu penilaian dikelompokkan per mapel', async () => {
  go('/student/grades')
  const sec = await screen.findByRole('region', { name: 'Nilai Matematika' }, T)
  expect(within(sec).getByText('Latihan Fungsi Kuadrat')).toBeInTheDocument()
  expect(within(sec).getByText('Menunggu penilaian')).toBeInTheDocument()
  expect(within(sec).getByText('Belum ada nilai')).toBeInTheDocument()
  expect(screen.getByText('Nilai tercatat')).toBeInTheDocument()
}, 30000)

test('jadwal: mingguan, hari ini disorot, tampilan harian per hari', async () => {
  const user = userEvent.setup()
  go('/student/schedule')
  const mon = await screen.findByRole('region', { name: 'Senin' }, T)
  expect(within(mon).getByText('Matematika')).toBeInTheDocument()
  expect(within(mon).getByText(/07:30/)).toBeInTheDocument()
  expect(screen.getByText(/^Jadwal berikutnya:/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Harian' }))
  await user.click(await screen.findByRole('tab', { name: /Rabu/ }))
  expect(await find('Tidak ada jadwal')).toBeInTheDocument() // kelas X IPA 1 tidak punya sesi Rabu
  await user.click(screen.getByRole('tab', { name: /Selasa/ }))
  expect(await find('Bahasa Indonesia')).toBeInTheDocument()
}, 30000)

test('pengumuman: filter kategori, buka detail, kembali; pengumuman guru tidak bisa dibuka', async () => {
  const user = userEvent.setup()
  let v = go('/student/announcements')
  await user.click(await find('Ujian Tengah Semester'))
  expect(await find(/UTS dimulai 26 Oktober 2026/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Kembali ke daftar pengumuman' })).toHaveAttribute('href', '/student/announcements')
  v.unmount()

  v = go('/student/announcements')
  await find('Pemeliharaan Sistem')
  await user.click(screen.getByRole('button', { name: /^Akademik/ }))
  expect(screen.queryByText('Pemeliharaan Sistem')).not.toBeInTheDocument()
  expect(screen.getByText('Ujian Tengah Semester')).toBeInTheDocument()
  v.unmount()

  go('/student/announcements/3') // sasaran guru
  expect(await find('Pengumuman tidak tersedia untuk Anda.')).toBeInTheDocument()
}, 40000)

test('materi: tombol sebelumnya/selanjutnya dalam satu mapel; filter mapel kosong; pencarian mapel', async () => {
  const user = userEvent.setup()
  let v = go('/student/materials/1')
  const next = await screen.findByRole('link', { name: /Selanjutnya/ }, T)
  expect(next).toHaveAttribute('href', '/student/materials/3')
  expect(next).toHaveTextContent('Bab 3 - Fungsi Eksponen & Logaritma')
  expect(screen.queryByRole('link', { name: /Sebelumnya/ })).not.toBeInTheDocument()
  v.unmount()

  v = go('/student/materials?subject=2')
  expect(await find('Materi tidak ditemukan')).toBeInTheDocument()
  v.unmount()

  go('/student/subjects')
  await find('Matematika')
  await user.type(screen.getByLabelText('Cari mapel atau guru'), 'zzz')
  expect(await find('Mata pelajaran tidak ditemukan')).toBeInTheDocument()
}, 40000)

// ---------------------------------------------------------------- Mode API (fetch = stub, tanpa jaringan)
const res = (status, body) => ({ status, ok: status >= 200 && status < 300, headers: { get: () => null }, json: async () => body })
const list = (data) => res(200, { data, meta: { current_page: 1, last_page: 1 } })
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

test('mode API: dashboard, tugas lewat tenggat, dan nilai siswa membaca endpoint backend', async () => {
  const siswa = { id_pengguna: 9, nisn: '0012345678', email: 's@x.id', peran: 'siswa', aktif: true }
  const mapel = { id_mapel: 1, nama_mapel: 'Fisika', guru: { id_pengguna: 2, username: 'bu.ratna' } }
  const iso = (d) => new Date(Date.now() + d * 864e5).toISOString()
  const routes = {
    'GET /auth/me': () => res(200, { data: siswa }),
    'GET /mapel': () => list([mapel]),
    'GET /tugas': () => list([
      { id_tugas: 1, id_mapel: 1, judul: 'Laporan Praktikum', instruksi: 'Tulis laporan.', batas_waktu: iso(-2), status: 'terbuka', mapel: { nama_mapel: 'Fisika' } },
      { id_tugas: 2, id_mapel: 1, judul: 'Soal Gerak Lurus', instruksi: 'Kerjakan.', batas_waktu: iso(3), status: 'terbuka', mapel: { nama_mapel: 'Fisika' } },
    ]),
    'GET /nilai/saya': () => list([{ id_nilai: 5, id_siswa: 9, sumber: 'tugas', nilai: '88', umpan_balik: 'Rapi', rujukan: { id_tugas: 7, id_mapel: 1, judul: 'Kuis Kinematika' } }]),
    'GET /pengumuman': () => list([{ id_pengumuman: 4, judul: 'Libur Semester', isi: 'Libur mulai Senin.', cakupan: 'global', penulis: { username: 'admin' }, created_at: '2026-11-10T08:00:00Z' }]),
    'GET /siswa/9/jadwal': () => list([]),
  }
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const p = String(url).replace(/^.*\/api\/v1/, '').split('?')[0]
    if (String(url).endsWith('/sanctum/csrf-cookie')) return res(204, null)
    return routes[`${(init.method ?? 'GET').toUpperCase()} ${p}`]?.() ?? list([])
  })
  localStorage.clear()
  vi.resetModules(); vi.stubEnv('VITE_USE_MOCK', 'false')
  const [{ default: LiveApp }, { AuthProvider: Auth }, { ToastProvider: Toast }] = await Promise.all([import('../routes'), import('../contexts/AuthContext'), import('../contexts/ToastContext')])
  const mount = (path) => render(<MemoryRouter initialEntries={[path]}><Toast><Auth><LiveApp /></Auth></Toast></MemoryRouter>)

  let v = mount('/student/dashboard')
  expect(await screen.findByRole('heading', { name: 'Halo, 0012345678!' }, T)).toBeInTheDocument()
  const due = await screen.findByRole('link', { name: /Laporan Praktikum/ }, T)
  expect(due).toHaveTextContent('terlambat') // lewat tenggat, belum dikumpulkan
  expect(screen.getByRole('link', { name: /Libur Semester/ })).toHaveAttribute('href', '/student/announcements/4')
  v.unmount()

  v = mount('/student/assignments')
  await screen.findByText('Soal Gerak Lurus', {}, T)
  expect(screen.getByText('Belum dikumpulkan (lewat tenggat)')).toBeInTheDocument()
  v.unmount()

  mount('/student/grades')
  const sec = await screen.findByRole('region', { name: 'Nilai Fisika' }, T)
  expect(within(sec).getByText('Kuis Kinematika')).toBeInTheDocument()
  expect(within(sec).getByText('88')).toBeInTheDocument()
  expect(within(sec).getByText('Rapi')).toBeInTheDocument()
}, 60000)

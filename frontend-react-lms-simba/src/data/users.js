// Data simulasi pengguna (tanpa kata sandi; kredensial demo ada di demoAccounts.js).
// Akan digantikan respons API Laravel (/admin/pengguna).
export const users = [
  { id: 1, name: 'Admin Simba', email: 'admin@simba.test', username: 'admin', role: 'admin', status: 'active' },
  { id: 2, name: 'Bu Ratna Wulandari', email: 'guru@simba.test', username: 'guru', nip: '19820412 200501 2 004', role: 'teacher', status: 'active' },
  { id: 3, name: 'Andi Pratama', email: 'siswa@simba.test', username: 'siswa', nisn: '0064891224', role: 'student', status: 'active' },
  { id: 4, name: 'Siti Nurhaliza', email: 'siti@simba.test', username: 'siti', nisn: '0068129031', role: 'student', status: 'active' },
  { id: 5, name: 'Budi Santoso', email: 'budi@simba.test', username: 'budi', nip: '19790101 200501 1 001', role: 'teacher', status: 'inactive' },
  { id: 6, name: 'Dewi Lestari', email: 'dewi@simba.test', username: 'dewi', nisn: '0059104823', role: 'student', status: 'pending' },
]

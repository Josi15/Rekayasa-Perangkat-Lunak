// Data simulasi modul admin: guru, ruang, dan jadwal kelas awal.
import { studentSchedules } from './student.js'

export const teachers = [
  { id: 1, name: 'Dr. Hendra Kusuma' },
  { id: 2, name: 'Sri Hartatiek, S.Pd.' },
  { id: 3, name: 'Bambang Sudarsono, M.Si.' },
  { id: 4, name: 'Wahyu Triadi, S.Pd.' },
  { id: 5, name: 'David Kristy, M.A.' },
  { id: 6, name: 'Siti Rahmawati, S.Pd.' },
]
export const rooms = ['R. 101', 'R. 102', 'R. 103', 'R. 105', 'Lab Fisika', 'R. 12.1 (Home Base)', 'Lab Biologi 2', 'Lab Fisika Terapan', 'Lab Komputer & Bahasa']
export const dayOptions = [[1, 'Senin'], [2, 'Selasa'], [3, 'Rabu'], [4, 'Kamis'], [5, 'Jumat']]
export const defaultTeacherByCourse = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 }

const mk = (id, classId, day, start, end, courseId, teacherId, room) => ({ id, classId, day, start, end, courseId, teacherId, room })
export const classSchedulesSeed = [
  ...studentSchedules.map((s) => mk(s.id, 1, s.day, s.start, s.end, s.courseId, defaultTeacherByCourse[s.courseId], s.room)),
  mk(101, 2, 1, '07:00', '08:30', 2, 2, 'R. 102'),
  mk(102, 2, 2, '09:00', '10:30', 1, 1, 'R. 105'),
  mk(103, 2, 3, '07:00', '08:30', 4, 4, 'R. 105'),
  mk(104, 3, 1, '09:00', '10:30', 3, 3, 'Lab Fisika'),
]

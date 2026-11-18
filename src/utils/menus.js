import { LayoutDashboard, BookOpen, ClipboardList, GraduationCap, CalendarDays, Users, School, Settings, FileBarChart, Megaphone, UserRound } from 'lucide-react'

// soon: true = modul belum dibuat (fase berikutnya), ditampilkan nonaktif.
export const roleMenus = {
  student: [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { label: 'Kelas Saya', to: '/student/classes', icon: School },
    { label: 'Materi', to: '/student/materials', icon: BookOpen },
    { label: 'Tugas', to: '/student/tasks', icon: ClipboardList },
    { label: 'Nilai', to: '/student/grades', icon: GraduationCap },
    { label: 'Jadwal', to: '/student/schedule', icon: CalendarDays },
    { label: 'Pengumuman', to: '/student/announcements', icon: Megaphone },
    { label: 'Profil', to: '/student/profile', icon: UserRound },
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard },
    { label: 'Kelas', icon: School, soon: true },
    { label: 'Materi', icon: BookOpen, soon: true },
    { label: 'Tugas & Penilaian', icon: ClipboardList, soon: true },
    { label: 'Pengumuman', icon: Megaphone, soon: true },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Pengguna', icon: Users, soon: true },
    { label: 'Kelas & Mapel', icon: School, soon: true },
    { label: 'Laporan', icon: FileBarChart, soon: true },
    { label: 'Pengaturan', icon: Settings, soon: true },
  ],
}
export const roleLabels = { student: 'Siswa', teacher: 'Guru', admin: 'Admin' }

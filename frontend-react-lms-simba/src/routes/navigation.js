import { UserCheck, FileCheck2, CircleHelp, LayoutDashboard, BookOpen, FileText, ClipboardList, BarChart3, CalendarDays, Megaphone, Users, School, Settings, FileBarChart } from 'lucide-react'

// Satu sumber kebenaran untuk MENU sidebar tiap peran. Elemen halaman didaftarkan di *Routes.jsx;
// `npm run check:routes` memastikan setiap item menu punya rute dan setiap tautan menuju rute yang ada.
export const navigation = {
  student: [
    { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { label: 'Mata Pelajaran', path: 'subjects', icon: BookOpen },
    { label: 'Materi', path: 'materials', icon: FileText },
    { label: 'Tugas', path: 'assignments', icon: ClipboardList },
    { label: 'Nilai', path: 'grades', icon: BarChart3 },
    { label: 'Jadwal', path: 'schedule', icon: CalendarDays },
    { label: 'Pengumuman', path: 'announcements', icon: Megaphone },
  ],
  teacher: [
    { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { label: 'Jadwal Mengajar', path: 'schedule', icon: CalendarDays },
    { label: 'Manajemen Modul', path: 'materials', icon: BookOpen },
    { label: 'Bank Tugas & Evaluasi', path: 'assignments', icon: ClipboardList },
    { label: 'Presensi KBM', path: 'attendance', icon: UserCheck },
    { label: 'Buku Nilai & Leger', path: 'grading', icon: FileCheck2 },
    { label: 'Kuis Form CBT', path: 'quiz', icon: CircleHelp },
    { label: 'Profil & Pengaturan', path: 'profile', icon: Settings, bottom: true },
  ],
  admin: [
    { label: 'Dashboard Admin', path: 'dashboard', icon: LayoutDashboard },
    { label: 'Manajemen Pengguna', path: 'users', icon: Users },
    { label: 'Kelas & Rombel', path: 'classes', icon: School },
    { label: 'Mata Pelajaran & Kurikulum', path: 'subjects', icon: BookOpen },
    { label: 'Jadwal & Kalender KBM', path: 'schedule', icon: CalendarDays },
    { label: 'Materi & Silabus Satdik', path: 'materials', icon: FileText },
    { label: 'Bank Tugas & Evaluasi', path: 'assignments', icon: ClipboardList },
    { label: 'Kuis Form & CBT', path: 'quiz', icon: CircleHelp },
    { label: 'Monitoring Presensi', path: 'attendance', icon: UserCheck },
    { label: 'Pengumuman', path: 'announcements', icon: Megaphone },
    { label: 'Laporan', path: 'reports', icon: FileBarChart },
    { label: 'Pengaturan Sistem', path: 'settings', icon: Settings, bottom: true },
  ],
}

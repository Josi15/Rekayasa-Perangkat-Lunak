// Seed modul guru (guru login: id 2). Siswa merujuk ke data/users.js, kelas/mapel ke data/academic.js.
// teachingClasses = pengampuan guru per kelas+mapel+tahun ajaran; studentIds = peserta pada pengampuan itu.
export const teachingClasses = [
  { classId: 1, subjectId: 1, teacherId: 2, year: '2026/2027', status: 'active', studentIds: [3, 4] },
  { classId: 2, subjectId: 1, teacherId: 2, year: '2026/2027', status: 'active', studentIds: [6] },
  { classId: 3, subjectId: 3, teacherId: 2, year: '2025/2026', status: 'finished', studentIds: [3] },
]
export const teacherAssignments = [
  { id: 1, classId: 1, title: 'Latihan Fungsi Kuadrat', dueDate: '2026-10-20' },
  { id: 2, classId: 2, title: 'Kuis Persamaan Linear', dueDate: '2026-10-18' },
]
export const teacherSubmissions = [
  { id: 1, assignmentId: 1, studentId: 3, submittedAt: '2026-10-14', status: 'submitted' },
  { id: 2, assignmentId: 1, studentId: 4, submittedAt: '2026-10-13', status: 'graded' },
  { id: 3, assignmentId: 2, studentId: 6, submittedAt: '2026-10-15', status: 'submitted' },
]
export const teacherMaterials = [
  { id: 1, title: 'Fungsi Kuadrat', description: 'Pengantar fungsi kuadrat.', content: 'Bentuk umum: f(x) = ax² + bx + c.\n\nGrafiknya berupa parabola.', classIds: [1, 2], status: 'published', order: 1, updatedAt: '2026-10-10', attachments: [{ name: 'fungsi-kuadrat.pdf', size: 482000 }] },
  { id: 2, title: 'Persamaan Linear', description: 'Dasar persamaan linear satu variabel.', content: 'Persamaan linear berbentuk ax + b = 0.', classIds: [2], status: 'draft', order: 2, updatedAt: '2026-10-09', attachments: [] },
  { id: 3, title: 'Bab 3 - Fungsi Eksponen & Logaritma', description: 'Fase E - Sifat eksponen, logaritma, dan grafik fungsinya', content: '', classIds: [1], status: 'published', order: 3, updatedAt: '2026-10-14', attachments: [{ name: 'bab3-eksponen.pdf', size: 4404019 }] },
  { id: 4, title: 'LKPD Praktikum Statistika Dasar', description: 'Petunjuk kerja & format laporan pengolahan data', content: '', classIds: [2], status: 'published', order: 4, updatedAt: '2026-10-13', attachments: [{ name: 'lkpd-statistika.docx', size: 1153434 }] },
  { id: 5, title: 'Slide PPT Bab 4 - Trigonometri Dasar', description: 'Materi presentasi 42 slide interaktif perbandingan sudut', content: '', classIds: [1], status: 'published', order: 5, updatedAt: '2026-10-12', attachments: [{ name: 'bab4-trigonometri.pptx', size: 15518925 }] },
  { id: 6, title: 'Modul Ajar Bab 1 - Barisan & Deret', description: 'Barisan aritmetika dan geometri, penerapan sehari-hari', content: '', classIds: [1, 2], status: 'published', order: 6, updatedAt: '2026-10-11', attachments: [{ name: 'modul-barisan.pdf', size: 3774873 }] },
  { id: 7, title: 'SOP & Keselamatan Kerja Lab Komputer', description: 'Prosedur penggunaan perangkat dan jaringan', content: '', classIds: [2], status: 'published', order: 7, updatedAt: '2026-10-08', attachments: [{ name: 'sop-lab.pdf', size: 870400 }] },
  { id: 8, title: 'Slide PPT Bab 2 - Limit Fungsi', description: 'Draf slide pengantar limit', content: '', classIds: [1], status: 'draft', order: 8, updatedAt: '2026-10-16', attachments: [{ name: 'bab2-limit.pptx', size: 9541000 }] },
]

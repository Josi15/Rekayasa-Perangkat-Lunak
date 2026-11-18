// Pintu masuk service. Halaman HANYA mengimpor dari sini, tidak pernah dari data/ atau db.js,
// sehingga fase integrasi cukup mengganti isi service (lihat http.js → apiRequest, endpoints.js).
export { authService } from './authService'
export { userService } from './userService'
export { classService } from './classService'
export { subjectService } from './subjectService'
export { materialService } from './materialService'
export { assignmentService } from './assignmentService'
export { submissionService } from './submissionService'
export { gradeService } from './gradeService'
export { scheduleService } from './scheduleService'
export { announcementService } from './announcementService'
export { reportService, reportCatalog } from './reportService'
export { settingService } from './settingService'

// Fasad per peran / modul
export { teacherService } from './teacherService'
export { teacherAssignmentService } from './teacherAssignmentService'
export { studentService } from './studentService'
export { profileService } from './profileService'
export { teacherHomeService } from './teacherHomeService'
export { teacherScheduleService } from './teacherScheduleService'
export { attendanceService } from './attendanceService'
export { quizService } from './quizService'
export { ledgerService } from './ledgerService'

// Infrastruktur untuk konteks/halaman (tetap lewat pintu masuk ini)
export { serviceMode } from './mode'
export { onUnauthorized, ApiError } from './http'
export { fileApi as fileService } from './api/contentApi'

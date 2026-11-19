import { createResource } from './api.js'
import * as d from '../data/mock.js'
import { materials } from '../data/student.js'
export { studentService } from './studentService.js'
export { studentTasks } from './studentTasks.js'
export { studentGrades } from './studentGrades.js'
export { studentSchedule } from './studentSchedule.js'
export { studentNotices } from './studentNotices.js'
export { studentProfile } from './studentProfile.js'
export { studentQuiz } from './studentQuiz.js'
export { studentAttendance } from './studentAttendance.js'
export { classScheduleService } from './classSchedules.js'

export { authService } from './authService.js'
export const userService = createResource(d.users)
export const classService = createResource(d.classes)
export const subjectService = createResource(d.subjects)
export const materialService = createResource(materials)
export const assignmentService = createResource(d.assignments)
export const submissionService = createResource(d.submissions)
export const gradeService = createResource(d.grades)
export const scheduleService = createResource(d.schedules)
export const announcementService = createResource(d.announcements)
export const reportService = createResource(d.reports)
export const settingService = createResource(d.settings)

import TeacherLayout from '../layouts/TeacherLayout'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import ClassesPage from '../pages/teacher/ClassesPage'
import ClassDetailPage from '../pages/teacher/ClassDetailPage'
import MaterialsPage from '../pages/teacher/MaterialsPage'
import MaterialFormPage from '../pages/teacher/MaterialFormPage'
import MaterialDetailPage from '../pages/teacher/MaterialDetailPage'
import AssignmentsPage from '../pages/teacher/AssignmentsPage'
import AssignmentManagePage from '../pages/teacher/AssignmentManagePage'
import AssignmentFormPage from '../pages/teacher/AssignmentFormPage'
import AssignmentDetailPage from '../pages/teacher/AssignmentDetailPage'
import GradeRecapPage from '../pages/teacher/GradeRecapPage'
import SchedulePage from '../pages/teacher/SchedulePage'
import AttendancePage from '../pages/teacher/AttendancePage'
import QuizPage from '../pages/teacher/QuizPage'
import LedgerPage from '../pages/teacher/LedgerPage'
import ProfilePage from '../pages/teacher/ProfilePage'
import ProtectedRoute from './ProtectedRoute'
import { Navigate } from 'react-router-dom'

export const teacherRoutes = {
  element: <ProtectedRoute role="teacher" />,
  children: [{
    path: '/teacher', element: <TeacherLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <TeacherDashboard /> },
      { path: 'classes', element: <ClassesPage /> },
      { path: 'classes/:id', element: <ClassDetailPage /> },
      { path: 'materials', element: <MaterialsPage /> },
      { path: 'materials/new', element: <MaterialFormPage /> },
      { path: 'materials/:id', element: <MaterialDetailPage /> },
      { path: 'materials/:id/edit', element: <MaterialFormPage /> },
      { path: 'assignments', element: <AssignmentsPage /> },
      { path: 'assignments/manage', element: <AssignmentManagePage /> },
      { path: 'assignments/new', element: <AssignmentFormPage /> },
      { path: 'assignments/:id', element: <AssignmentDetailPage /> },
      { path: 'assignments/:id/edit', element: <AssignmentFormPage /> },
      { path: 'grading', element: <LedgerPage /> },
      { path: 'grading/recap', element: <GradeRecapPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'quiz', element: <QuizPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  }],
}

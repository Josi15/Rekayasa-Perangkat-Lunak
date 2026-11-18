import { Navigate } from 'react-router-dom'
import StudentLayout from '../layouts/StudentLayout'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentSubjectsPage from '../pages/student/StudentSubjectsPage'
import StudentMaterialsPage from '../pages/student/StudentMaterialsPage'
import StudentMaterialDetailPage from '../pages/student/StudentMaterialDetailPage'
import StudentAssignmentsPage from '../pages/student/StudentAssignmentsPage'
import StudentAssignmentDetailPage from '../pages/student/StudentAssignmentDetailPage'
import StudentGradesPage from '../pages/student/StudentGradesPage'
import StudentSchedulePage from '../pages/student/StudentSchedulePage'
import StudentAnnouncementsPage from '../pages/student/StudentAnnouncementsPage'
import StudentAnnouncementDetailPage from '../pages/student/StudentAnnouncementDetailPage'
import ProtectedRoute from './ProtectedRoute'

export const studentRoutes = {
  element: <ProtectedRoute role="student" />,
  children: [{
    path: '/student', element: <StudentLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'subjects', element: <StudentSubjectsPage /> },
      { path: 'materials', element: <StudentMaterialsPage /> },
      { path: 'materials/:id', element: <StudentMaterialDetailPage /> },
      { path: 'assignments', element: <StudentAssignmentsPage /> },
      { path: 'assignments/:id', element: <StudentAssignmentDetailPage /> },
      { path: 'grades', element: <StudentGradesPage /> },
      { path: 'schedule', element: <StudentSchedulePage /> },
      { path: 'announcements', element: <StudentAnnouncementsPage /> },
      { path: 'announcements/:id', element: <StudentAnnouncementDetailPage /> },
    ],
  }],
}

import { Navigate } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminClassesPage from '../pages/admin/AdminClassesPage'
import AdminSubjectsPage from '../pages/admin/AdminSubjectsPage'
import AdminAnnouncementsPage from '../pages/admin/AdminAnnouncementsPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage'
import AdminSchedulePage from '../pages/admin/AdminSchedulePage'
import AdminMaterialsPage from '../pages/admin/AdminMaterialsPage'
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage'
import AdminQuizPage from '../pages/admin/AdminQuizPage'
import AdminAttendancePage from '../pages/admin/AdminAttendancePage'
import ProtectedRoute from './ProtectedRoute'

export const adminRoutes = {
  element: <ProtectedRoute role="admin" />,
  children: [{
    path: '/admin', element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'classes', element: <AdminClassesPage /> },
      { path: 'subjects', element: <AdminSubjectsPage /> },
      { path: 'schedule', element: <AdminSchedulePage /> },
      { path: 'materials', element: <AdminMaterialsPage /> },
      { path: 'assignments', element: <AdminAssignmentsPage /> },
      { path: 'quiz', element: <AdminQuizPage /> },
      { path: 'attendance', element: <AdminAttendancePage /> },
      { path: 'announcements', element: <AdminAnnouncementsPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  }],
}

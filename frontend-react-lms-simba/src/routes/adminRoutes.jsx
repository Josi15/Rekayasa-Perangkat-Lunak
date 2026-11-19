import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminClasses from '../pages/admin/AdminClasses.jsx'
import AdminSchedules from '../pages/admin/AdminSchedules.jsx'

export const adminRoutes = [
  { index: true, element: <AdminDashboard /> },
  { path: 'classes', element: <AdminClasses /> },
  { path: 'schedules', element: <AdminSchedules /> },
]

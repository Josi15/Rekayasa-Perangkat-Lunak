import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import StudentLayout from '../layouts/StudentLayout.jsx'
import TeacherLayout from '../layouts/TeacherLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import Login from '../pages/auth/Login.jsx'
import ForgotPassword from '../pages/auth/ForgotPassword.jsx'
import { Forbidden, NotFound } from '../pages/errors/ErrorPage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { studentRoutes } from './studentRoutes.jsx'
import { teacherRoutes } from './teacherRoutes.jsx'
import { adminRoutes } from './adminRoutes.jsx'
import { useAuth } from '../hooks/useAuth.js'

const roleGroups = [
  ['student', StudentLayout, studentRoutes],
  ['teacher', TeacherLayout, teacherRoutes],
  ['admin', AdminLayout, adminRoutes],
]

function Home() {
  const { user } = useAuth()
  return <Navigate to={user ? `/${user.role}` : '/login'} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      {roleGroups.map(([role, Layout, children]) => (
        <Route key={role} element={<ProtectedRoute role={role} />}>
          <Route path={`/${role}`} element={<Layout />}>
            {children.map((c, i) => <Route key={i} {...c} />)}
          </Route>
        </Route>
      ))}
      <Route path="/403" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

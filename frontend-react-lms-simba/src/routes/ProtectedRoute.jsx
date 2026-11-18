import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingState from '../components/common/LoadingState'

// Pengecekan di sisi klien hanya untuk UX; otorisasi sebenarnya wajib di backend Laravel.
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/403" replace />
  return <Outlet />
}

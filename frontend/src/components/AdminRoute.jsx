import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }) {
  const { user, accessToken } = useAuth()
  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, role }) {
  const userStr = localStorage.getItem('parking_user')

  if (!userStr) {
    return <Navigate to="/" />
  }

  const user = JSON.parse(userStr)

  if (role === 'staff' && user.role !== 'staff') {
    return <Navigate to="/dashboard" />
  }

  if (role === 'user' && user.role === 'staff') {
    return <Navigate to="/staff" />
  }

  return children
}
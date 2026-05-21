import { Navigate } from 'react-router-dom'
import { isAuthenticated, getRole } from '../lib/auth'

// Accepts an optional `requiredRole` prop ('admin' | 'student').
// If provided, a mismatch redirects to /login (not just a missing token).
export default function ProtectedRoute({ children, requiredRole }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    const storedRole = getRole()
    if (storedRole && storedRole !== requiredRole) {
      return <Navigate to="/login" replace />
    }
  }

  return children
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  console.log('ProtectedRoute: Checking access', { 
    hasUser: !!user, 
    userRole: user?.role, 
    requiredRole, 
    loading 
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log('ProtectedRoute: Role mismatch', { 
      userRole: user.role, 
      requiredRole 
    })
    toast.error('You do not have permission to access this page')
    return <Navigate to="/dashboard" replace />
  }

  console.log('ProtectedRoute: Access granted')
  return children
}


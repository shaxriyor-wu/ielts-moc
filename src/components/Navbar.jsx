import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center space-x-2 text-primary-500 hover:text-primary-600"
              aria-label="Home"
            >
              <BookOpen className="h-6 w-6" />
              <span className="font-bold text-xl">IELTS CD Mock</span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{user.name}</span>
              </div>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-accent-500 px-3 py-2 rounded-md text-sm font-medium"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}


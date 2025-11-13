import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token and fetch profile
    const token = localStorage.getItem('auth_token')
    if (token) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const loadProfile = async () => {
    try {
      const profile = await authAPI.getProfile()
      setUser(profile)
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login with:', { email })
      const response = await authAPI.login(email, password)
      console.log('AuthContext: Login response:', response)
      const { token, refreshToken, user: userData } = response

      console.log('AuthContext: User data received:', userData)
      console.log('AuthContext: User role:', userData?.role)

      // Store tokens
      // In production, refreshToken should be httpOnly cookie set by backend
      localStorage.setItem('auth_token', token)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      setUser(userData)
      console.log('AuthContext: User set in state:', userData)
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      console.error('AuthContext: Login error:', error)
      console.error('AuthContext: Error response:', error.response)
      const message = error.response?.data?.message || error.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password)
      toast.success('Registration successful! Please login.')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updatedData) => {
    if (user) {
      setUser({ ...user, ...updatedData })
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getProfile: loadProfile,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}


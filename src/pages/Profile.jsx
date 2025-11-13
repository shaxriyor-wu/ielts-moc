import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, getProfile, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Update user data in localStorage (mock)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Siz tizimga kirmagansiz')
        return
      }

      // Update participant data if exists (this is the main source for admin panel)
      const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
      const participantIndex = participants.findIndex(p => p.email === user.email || p.userId === user.id)
      if (participantIndex !== -1) {
        participants[participantIndex] = {
          ...participants[participantIndex],
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
        }
        localStorage.setItem('test_participants', JSON.stringify(participants))
      } else {
        // If no participant data, create one
        participants.push({
          id: user.id,
          userId: user.id,
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          joinedAt: new Date().toISOString(),
        })
        localStorage.setItem('test_participants', JSON.stringify(participants))
      }

      // Also update mock users data if it exists in localStorage
      const storedMockUsers = localStorage.getItem('mock_users')
      if (storedMockUsers) {
        const mockUsers = JSON.parse(storedMockUsers)
        const userIndex = mockUsers.findIndex(u => u.id === user.id)
        if (userIndex !== -1) {
          mockUsers[userIndex] = {
            ...mockUsers[userIndex],
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          }
          localStorage.setItem('mock_users', JSON.stringify(mockUsers))
        }
      }

      // Update AuthContext user state directly
      updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      })
      
      setIsEditing(false)
      toast.success('Ma\'lumotlar yangilandi! Admin panelda ham yangilanadi.')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Ma\'lumotlarni yangilashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <User className="h-8 w-8 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mening Profilim</h1>
              <p className="text-gray-600">Shaxsiy ma'lumotlaringiz</p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit className="h-5 w-5" />
              <span>Tahrirlash</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>Saqlash</span>
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center space-x-2"
              >
                <X className="h-5 w-5" />
                <span>Bekor qilish</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>To'liq Ism</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ismingizni kiriting"
              />
            ) : (
              <p className="text-lg text-gray-900">{user.name || 'Kiritilmagan'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="Email manzilingiz"
              />
            ) : (
              <p className="text-lg text-gray-900">{user.email || 'Kiritilmagan'}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Telefon Raqam</span>
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+998 XX XXX XX XX"
              />
            ) : (
              <p className="text-lg text-gray-900">{user.phone || 'Kiritilmagan'}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <p className="text-lg text-gray-900 capitalize">
              {user.role === 'admin' ? 'Administrator' : 'O\'quvchi'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


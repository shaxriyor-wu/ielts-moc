import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { motion } from 'framer-motion'
import { Users, Search, Edit, Ban, Trash2, Shield, CheckCircle, XCircle, Menu, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminUserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, blocked
  const [filterRole, setFilterRole] = useState('all') // all, student, admin
  const [selectedUser, setSelectedUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, filterStatus, filterRole, users])

  const loadUsers = async () => {
    try {
      const mockDataModule = await import('../mocks/data/mockData.js')
      const mockUsers = mockDataModule.users || []
      const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
      
      const allUsers = [...mockUsers]
      participants.forEach(participant => {
        if (!allUsers.find(u => u.email === participant.email)) {
          allUsers.push({
            id: participant.id,
            name: participant.fullName,
            email: participant.email,
            phone: participant.phone,
            role: 'student',
            status: 'active',
            createdAt: participant.joinedAt,
          })
        }
      })

      // Add status if not exists
      const usersWithStatus = allUsers.map(user => ({
        ...user,
        status: user.status || 'active',
        blocked: user.blocked || false,
      }))

      setUsers(usersWithStatus)
      setFilteredUsers(usersWithStatus)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Foydalanuvchilarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      )
    }

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(user => user.status === 'active' && !user.blocked)
    } else if (filterStatus === 'blocked') {
      filtered = filtered.filter(user => user.blocked)
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    setFilteredUsers(filtered)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setEditData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    })
    setEditMode(true)
  }

  const handleSaveEdit = () => {
    if (!selectedUser) return

    const updatedUsers = users.map(user =>
      user.id === selectedUser.id
        ? { ...user, ...editData }
        : user
    )

    setUsers(updatedUsers)
    
    // Update localStorage
    const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
    const participantIndex = participants.findIndex(p => p.email === selectedUser.email || p.id === selectedUser.id)
    if (participantIndex !== -1) {
      participants[participantIndex] = {
        ...participants[participantIndex],
        fullName: editData.name,
        email: editData.email,
        phone: editData.phone,
      }
      localStorage.setItem('test_participants', JSON.stringify(participants))
    }

    setEditMode(false)
    setSelectedUser(null)
    toast.success('Foydalanuvchi ma\'lumotlari yangilandi')
  }

  const handleBlock = (user) => {
    const updatedUsers = users.map(u =>
      u.id === user.id ? { ...u, blocked: !u.blocked, status: u.blocked ? 'active' : 'blocked' } : u
    )
    setUsers(updatedUsers)
    toast.success(user.blocked ? 'Foydalanuvchi blokdan olindi' : 'Foydalanuvchi bloklandi')
  }

  const handleDelete = (user) => {
    if (window.confirm(`"${user.name}" foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) {
      const updatedUsers = users.filter(u => u.id !== user.id)
      setUsers(updatedUsers)
      
      // Remove from localStorage
      const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
      const filtered = participants.filter(p => p.email !== user.email && p.id !== user.id)
      localStorage.setItem('test_participants', JSON.stringify(filtered))
      
      toast.success('Foydalanuvchi o\'chirildi')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <Users className="h-8 w-8" />
                  <span>Foydalanuvchi Boshqaruvi</span>
                </h1>
                <p className="text-gray-600">Barcha foydalanuvchilarni boshqaring</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Qidirish..."
                  className="input-field pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">Barcha holatlar</option>
                <option value="active">Faol</option>
                <option value="blocked">Bloklangan</option>
              </select>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input-field"
              >
                <option value="all">Barcha rollar</option>
                <option value="student">O'quvchi</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-bold">Ism</th>
                    <th className="text-left p-4 font-bold">Email</th>
                    <th className="text-left p-4 font-bold">Telefon</th>
                    <th className="text-left p-4 font-bold">Rol</th>
                    <th className="text-left p-4 font-bold">Holat</th>
                    <th className="text-left p-4 font-bold">Ro'yxatdan o'tgan</th>
                    <th className="text-left p-4 font-bold">Harakatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium">{user.name}</td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4 text-gray-600">{user.phone || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'O\'quvchi'}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.blocked ? (
                          <span className="flex items-center space-x-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>Bloklangan</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Faol</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                            title="Tahrirlash"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleBlock(user)}
                            className={`p-2 rounded-lg ${
                              user.blocked
                                ? 'hover:bg-green-100 text-green-600'
                                : 'hover:bg-red-100 text-red-600'
                            }`}
                            title={user.blocked ? 'Blokdan olish' : 'Bloklash'}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Foydalanuvchilar topilmadi</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Modal */}
          {editMode && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
              >
                <h2 className="text-2xl font-bold mb-4">Foydalanuvchini Tahrirlash</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ism</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      className="input-field"
                    >
                      <option value="student">O'quvchi</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleSaveEdit} className="btn-primary flex-1">
                      Saqlash
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setSelectedUser(null)
                      }}
                      className="btn-secondary flex-1"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


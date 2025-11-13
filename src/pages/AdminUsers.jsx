import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, X, TrendingUp, BookOpen, Award, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminSidebar from '../components/AdminSidebar'

export default function AdminUsers() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      // Get all registered users from mockData
      const mockDataModule = await import('../mocks/data/mockData.js')
      const mockUsers = mockDataModule.users || []
      
      // Get participants
      const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
      
      // Get results
      const results = JSON.parse(localStorage.getItem('mock_results') || '[]')
      
      // Combine all users
      const allUsers = [...mockUsers]
      
      // Add participants as users if not already in list
      participants.forEach(participant => {
        if (!allUsers.find(u => u.email === participant.email)) {
          allUsers.push({
            id: participant.id,
            name: participant.fullName,
            email: participant.email,
            phone: participant.phone,
            role: 'student',
            joinedAt: participant.joinedAt,
          })
        }
      })
      
      // Add results to each user
      const usersWithStats = allUsers.map(user => {
        const userResults = results.filter(r => 
          r.userId === user.id || 
          participants.find(p => (p.userId === user.id || p.id === user.id) && p.email === user.email)
        )
        
        const participantData = participants.find(p => p.email === user.email)
        
        return {
          ...user,
          results: userResults,
          attempts: userResults.length,
          latestResult: userResults.length > 0 ? userResults[0] : null,
          averageBand: userResults.length > 0
            ? (userResults.reduce((sum, r) => sum + (r.finalBand || 0), 0) / userResults.length).toFixed(1)
            : null,
          participantData,
        }
      })
      
      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Foydalanuvchilarni yuklashda xatolik')
    } finally {
      setLoading(false)
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
                <Users className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <Users className="h-8 w-8" />
                  <span>Foydalanuvchilar</span>
                </h1>
                <p className="text-gray-600">Barcha ro'yxatdan o'tgan foydalanuvchilar</p>
              </div>
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Foydalanuvchilar Ro'yxati</h2>
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`font-bold ${selectedUser?.id === user.id ? 'text-white' : 'text-gray-900'}`}>
                        {user.name}
                      </p>
                      <p className={`text-sm ${selectedUser?.id === user.id ? 'text-white' : 'text-gray-600'}`}>
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className={`text-xs ${selectedUser?.id === user.id ? 'text-white' : 'text-gray-500'}`}>
                          {user.phone}
                        </p>
                      )}
                    </div>
                    {user.attempts > 0 && (
                      <div className={`text-right ${selectedUser?.id === user.id ? 'text-white' : 'text-primary-500'}`}>
                        <p className="text-lg font-bold">{user.attempts}</p>
                        <p className="text-xs">test</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-500 text-center py-8">Foydalanuvchilar topilmadi</p>
              )}
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  {selectedUser.phone && <p className="text-gray-600">{selectedUser.phone}</p>}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-5 w-5 text-primary-500" />
                    <span className="text-sm text-gray-600">Jami Testlar</span>
                  </div>
                  <p className="text-2xl font-bold text-primary-500">{selectedUser.attempts || 0}</p>
                </div>
                <div className="bg-accent-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-accent-500" />
                    <span className="text-sm text-gray-600">O'rtacha Band</span>
                  </div>
                  <p className="text-2xl font-bold text-accent-500">
                    {selectedUser.averageBand || 'N/A'}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-600">Oxirgi Natija</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {selectedUser.latestResult?.finalBand?.toFixed(1) || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Ma'lumotlar */}
              {selectedUser.participantData && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold mb-2">Qo'shilgan Ma'lumotlar</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">To'liq Ism:</span>
                      <p className="font-medium">{selectedUser.participantData.fullName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Telefon:</span>
                      <p className="font-medium">{selectedUser.participantData.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedUser.participantData.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Qo'shilgan:</span>
                      <p className="font-medium">
                        {new Date(selectedUser.participantData.joinedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Natijalari */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Test Natijalari</span>
                </h3>
                {selectedUser.results && selectedUser.results.length > 0 ? (
                  <div className="space-y-4">
                    {selectedUser.results.map((result, idx) => (
                      <motion.div
                        key={result.attemptId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold">Test #{idx + 1}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(result.submittedAt || Date.now()).toLocaleString()}
                            </p>
                          </div>
                          {result.finalBand && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary-500">
                                {result.finalBand.toFixed(1)}
                              </p>
                              <p className="text-xs text-gray-600">Band Score</p>
                            </div>
                          )}
                        </div>

                        {/* Scores Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Listening</p>
                            <p className="font-bold text-blue-600">
                              {result.autoScores?.listeningBand?.toFixed(1) || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              ({result.autoScores?.listening || 0}/40)
                            </p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Reading</p>
                            <p className="font-bold text-green-600">
                              {result.autoScores?.readingBand?.toFixed(1) || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              ({result.autoScores?.reading || 0}/40)
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Writing</p>
                            <p className="font-bold text-yellow-600">
                              {result.manualScores?.writing?.toFixed(1) || 'Kutilmoqda'}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Speaking</p>
                            <p className="font-bold text-purple-600">
                              {result.manualScores?.speaking?.toFixed(1) || 'Kutilmoqda'}
                            </p>
                          </div>
                        </div>

                        {/* Writing Submissions */}
                        {result.answers?.writing && (
                          <details className="mt-4">
                            <summary className="cursor-pointer text-primary-500 font-medium text-sm">
                              Writing Javoblarni Ko'rish
                            </summary>
                            <div className="mt-2 space-y-2">
                              <div className="p-3 bg-white rounded border">
                                <p className="text-xs font-medium text-gray-600 mb-1">Task 1:</p>
                                <div
                                  className="text-sm prose max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: result.answers.writing.task1 || 'Javob yo\'q',
                                  }}
                                />
                              </div>
                              <div className="p-3 bg-white rounded border">
                                <p className="text-xs font-medium text-gray-600 mb-1">Task 2:</p>
                                <div
                                  className="text-sm prose max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: result.answers.writing.task2 || 'Javob yo\'q',
                                  }}
                                />
                              </div>
                            </div>
                          </details>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Hozircha test natijalari yo'q</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="card text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Foydalanuvchini tanlang</p>
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}


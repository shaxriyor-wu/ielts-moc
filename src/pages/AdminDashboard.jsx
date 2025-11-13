import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { resultsAPI, testsAPI } from '../utils/api'
import { motion } from 'framer-motion'
import { Users, FileText, Award, TrendingUp, Activity, DollarSign, MessageCircle, Menu } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    totalAttempts: 0,
    averageBand: 0,
    activeUsers: 0,
    recentPayments: 0,
  })
  const [chartData, setChartData] = useState({
    dailyAttempts: [],
    bandDistribution: [],
    testPopularity: [],
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [tests, results] = await Promise.all([
        testsAPI.getAll(),
        resultsAPI.getAll(),
      ])

      // Get users from localStorage
      const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
      const mockDataModule = await import('../mocks/data/mockData.js')
      const mockUsers = mockDataModule.users || []
      const allUsers = [...mockUsers, ...participants.map(p => ({ id: p.id, name: p.fullName, email: p.email }))]

      // Calculate stats
      const uniqueUsers = new Set()
      results.forEach(r => {
        if (r.userId) uniqueUsers.add(r.userId)
      })
      participants.forEach(p => {
        if (p.userId) uniqueUsers.add(p.userId)
      })

      const completedResults = results.filter(r => r.finalBand !== null && r.finalBand !== undefined)
      const bands = completedResults.map(r => r.finalBand).filter(b => b !== null)
      const averageBand = bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : 0

      // Daily attempts (last 7 days)
      const dailyAttempts = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const count = results.filter(r => {
          const resultDate = new Date(r.submittedAt || Date.now()).toISOString().split('T')[0]
          return resultDate === dateStr
        }).length
        dailyAttempts.push({ date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), attempts: count })
      }

      // Band distribution
      const bandRanges = [
        { name: '0-4.0', min: 0, max: 4.0 },
        { name: '4.5-5.0', min: 4.5, max: 5.0 },
        { name: '5.5-6.0', min: 5.5, max: 6.0 },
        { name: '6.5-7.0', min: 6.5, max: 7.0 },
        { name: '7.5-8.0', min: 7.5, max: 8.0 },
        { name: '8.5-9.0', min: 8.5, max: 9.0 },
      ]
      const bandDistribution = bandRanges.map(range => ({
        name: range.name,
        value: bands.filter(b => b >= range.min && b <= range.max).length,
      }))

      // Test popularity
      const testPopularity = tests.map(test => ({
        name: test.title || 'Test',
        attempts: results.filter(r => r.testId === test.id).length,
      }))

      setStats({
        totalUsers: uniqueUsers.size || allUsers.length,
        totalTests: tests.length,
        totalAttempts: results.length,
        averageBand: Math.round(averageBand * 10) / 10,
        activeUsers: participants.length,
        recentPayments: 0, // Mock data
      })

      setChartData({
        dailyAttempts,
        bandDistribution,
        testPopularity,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Dashboard ma\'lumotlarini yuklashda xatolik')
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
          <div className="mb-8 flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Platforma statistikasi va tahlili</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jami Foydalanuvchilar</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Users className="h-8 w-8 text-primary-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jami Testlar</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Topshirilgan Testlar</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
                </div>
                <div className="p-3 bg-accent-100 rounded-lg">
                  <Activity className="h-8 w-8 text-accent-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">O'rtacha Band</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageBand.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Attempts Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-bold mb-4">Kunlik Topshirilgan Testlar</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.dailyAttempts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attempts" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Band Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <h2 className="text-xl font-bold mb-4">Band Score Taqsimoti</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.bandDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.bandDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Test Popularity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-bold mb-4">Testlar Mashhurligi</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.testPopularity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attempts" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Activity className="h-6 w-6" />
              <span>So'nggi Faollik</span>
            </h2>
            <div className="space-y-3">
              {(() => {
                const results = JSON.parse(localStorage.getItem('mock_results') || '[]')
                const recentResults = results.slice(0, 5).sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
                return recentResults.length > 0 ? (
                  recentResults.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Test topshirildi</p>
                        <p className="text-sm text-gray-600">
                          {new Date(result.submittedAt || Date.now()).toLocaleString()}
                        </p>
                      </div>
                      {result.finalBand && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-500">{result.finalBand.toFixed(1)}</p>
                          <p className="text-xs text-gray-600">Band Score</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Hozircha faollik yo'q</p>
                )
              })()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}


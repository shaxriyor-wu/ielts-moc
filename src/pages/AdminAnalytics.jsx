import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { resultsAPI, testsAPI } from '../utils/api'
import { motion } from 'framer-motion'
import { BarChart3, Users, FileText, TrendingUp, Download, Menu, Calendar } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdminAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayAttempts: 0,
    averageBand: 0,
    mostUsedTest: 'N/A',
  })
  const [chartData, setChartData] = useState({
    monthlyResults: [],
    sectionDistribution: [],
    topUsers: [],
    regionDistribution: [],
  })
  const [dateRange, setDateRange] = useState('month') // week, month, year

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      const [tests, results] = await Promise.all([
        testsAPI.getAll(),
        resultsAPI.getAll(),
      ])

      const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
      const mockDataModule = await import('../mocks/data/mockData.js')
      const mockUsers = mockDataModule.users || []
      const allUsers = [...mockUsers, ...participants.map(p => ({ id: p.id, name: p.fullName }))]

      // Today's attempts
      const today = new Date().toISOString().split('T')[0]
      const todayAttempts = results.filter(r => {
        const date = new Date(r.submittedAt || Date.now()).toISOString().split('T')[0]
        return date === today
      }).length

      // Average band
      const completedResults = results.filter(r => r.finalBand !== null && r.finalBand !== undefined)
      const bands = completedResults.map(r => r.finalBand).filter(b => b !== null)
      const averageBand = bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : 0

      // Most used test
      const testCounts = {}
      results.forEach(r => {
        if (r.testId) {
          testCounts[r.testId] = (testCounts[r.testId] || 0) + 1
        }
      })
      const mostUsedTestId = Object.keys(testCounts).reduce((a, b) => testCounts[a] > testCounts[b] ? a : b, '')
      const mostUsedTest = tests.find(t => t.id === mostUsedTestId)?.title || 'N/A'

      // Monthly results (last 6 months)
      const monthlyResults = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthResults = results.filter(r => {
          const resultDate = new Date(r.submittedAt || Date.now())
          return resultDate >= monthStart && resultDate <= monthEnd
        })
        
        const monthBands = monthResults
          .map(r => r.finalBand)
          .filter(b => b !== null && b !== undefined)
        const avgBand = monthBands.length > 0
          ? monthBands.reduce((a, b) => a + b, 0) / monthBands.length
          : 0

        monthlyResults.push({
          month: monthStr,
          attempts: monthResults.length,
          averageBand: avgBand,
        })
      }

      // Section distribution
      const sectionDistribution = [
        {
          name: 'Listening',
          average: completedResults.reduce((sum, r) => sum + (r.autoScores?.listeningBand || 0), 0) / completedResults.length || 0,
          count: completedResults.filter(r => r.autoScores?.listeningBand).length,
        },
        {
          name: 'Reading',
          average: completedResults.reduce((sum, r) => sum + (r.autoScores?.readingBand || 0), 0) / completedResults.length || 0,
          count: completedResults.filter(r => r.autoScores?.readingBand).length,
        },
        {
          name: 'Writing',
          average: completedResults.reduce((sum, r) => sum + (r.manualScores?.writing || 0), 0) / completedResults.filter(r => r.manualScores?.writing).length || 0,
          count: completedResults.filter(r => r.manualScores?.writing).length,
        },
        {
          name: 'Speaking',
          average: completedResults.reduce((sum, r) => sum + (r.manualScores?.speaking || 0), 0) / completedResults.filter(r => r.manualScores?.speaking).length || 0,
          count: completedResults.filter(r => r.manualScores?.speaking).length,
        },
      ]

      // Top users
      const userAttempts = {}
      results.forEach(r => {
        if (r.userId) {
          if (!userAttempts[r.userId]) {
            userAttempts[r.userId] = { attempts: 0, totalBand: 0, count: 0 }
          }
          userAttempts[r.userId].attempts++
          if (r.finalBand) {
            userAttempts[r.userId].totalBand += r.finalBand
            userAttempts[r.userId].count++
          }
        }
      })

      const topUsers = Object.entries(userAttempts)
        .map(([userId, data]) => {
          const user = allUsers.find(u => u.id === userId)
          return {
            name: user?.name || userId.slice(-6),
            attempts: data.attempts,
            averageBand: data.count > 0 ? data.totalBand / data.count : 0,
          }
        })
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 10)

      setStats({
        totalUsers: allUsers.length,
        todayAttempts,
        averageBand,
        mostUsedTest,
      })

      setChartData({
        monthlyResults,
        sectionDistribution,
        topUsers,
        regionDistribution: [], // Mock data - in production, get from user profiles
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Tahlil ma\'lumotlarini yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format) => {
    toast.info(`${format.toUpperCase()} eksport funksiyasi tez orada qo'shiladi`)
  }

  const handleAIAnalysis = async () => {
    toast.info('AI tahlil generatsiya qilinmoqda...')
    // In production, call DeepSeek API to generate analysis report
    setTimeout(() => {
      toast.success('AI tahlil tayyor! (Mock)')
    }, 2000)
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
                  <BarChart3 className="h-8 w-8" />
                  <span>Tahlil</span>
                </h1>
                <p className="text-gray-600">Platforma statistikasi va tahlili</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="week">Haftalik</option>
                <option value="month">Oylik</option>
                <option value="year">Yillik</option>
              </select>
              <button
                onClick={handleAIAnalysis}
                className="btn-primary flex items-center space-x-2"
              >
                <span>🤖</span>
                <span>AI Tahlil Yaratish</span>
              </button>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="btn-secondary text-sm"
                  title="CSV eksport"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="btn-secondary text-sm"
                  title="Excel eksport"
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="btn-secondary text-sm"
                  title="PDF eksport"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-sm text-gray-600 mb-1">Bugun Topshirilgan</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.todayAttempts}</p>
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
                  <p className="text-sm text-gray-600 mb-1">O'rtacha Band</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageBand.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-accent-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-accent-500" />
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
                  <p className="text-sm text-gray-600 mb-1">Eng Mashhur Test</p>
                  <p className="text-lg font-bold text-gray-900 truncate">{stats.mostUsedTest}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-bold mb-4">Oylik Natijalar Dinamikasi</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.monthlyResults}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="attempts" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Line type="monotone" dataKey="averageBand" stroke="#10B981" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Section Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <h2 className="text-xl font-bold mb-4">Bo'limlar Bo'yicha O'rtacha Ball</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.sectionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 9]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Top Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-bold mb-4">Eng Faol Foydalanuvchilar</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.topUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="attempts" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  )
}


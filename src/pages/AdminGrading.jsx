import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { motion } from 'framer-motion'
import { Award, Search, Filter, Download, Eye, Edit, FileText, CheckCircle, Clock, Menu } from 'lucide-react'
import toast from 'react-hot-toast'
import { resultsAPI } from '../utils/api'

export default function AdminGrading() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [attempts, setAttempts] = useState([])
  const [filteredAttempts, setFilteredAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    testType: 'all', // all, listening, reading, writing, speaking
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
    status: 'all', // all, graded, pending
  })
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    graded: 0,
    pending: 0,
    averageBand: 0,
    highest: 0,
    lowest: 0,
  })

  useEffect(() => {
    loadAttempts()
  }, [])

  useEffect(() => {
    filterAttempts()
  }, [filters, attempts])

  const loadAttempts = async () => {
    try {
      const results = await resultsAPI.getAll()
      setAttempts(results)
      calculateStats(results)
    } catch (error) {
      console.error('Error loading attempts:', error)
      toast.error('Natijalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const graded = data.filter(a => a.finalBand !== null && a.finalBand !== undefined)
    const bands = graded.map(a => a.finalBand).filter(b => b !== null)
    const average = bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : 0
    const highest = bands.length > 0 ? Math.max(...bands) : 0
    const lowest = bands.length > 0 ? Math.min(...bands) : 0

    setStats({
      total: data.length,
      graded: graded.length,
      pending: data.length - graded.length,
      averageBand: average,
      highest,
      lowest,
    })
  }

  const filterAttempts = () => {
    let filtered = [...attempts]

    // Test type filter
    if (filters.testType !== 'all') {
      // Filter by section that needs grading
      filtered = filtered.filter(attempt => {
        if (filters.testType === 'writing') {
          return attempt.answers?.writing && (!attempt.scores?.writing || attempt.scores.writing === null)
        }
        if (filters.testType === 'speaking') {
          return attempt.answers?.speaking && (!attempt.scores?.speaking || attempt.scores.speaking === null)
        }
        return true
      })
    }

    // Date filter
    if (filters.dateFrom) {
      filtered = filtered.filter(attempt => {
        const date = new Date(attempt.submittedAt || Date.now())
        return date >= new Date(filters.dateFrom)
      })
    }
    if (filters.dateTo) {
      filtered = filtered.filter(attempt => {
        const date = new Date(attempt.submittedAt || Date.now())
        return date <= new Date(filters.dateTo)
      })
    }

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(attempt =>
        attempt.userId?.toLowerCase().includes(term) ||
        attempt.attemptId?.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (filters.status === 'graded') {
      filtered = filtered.filter(attempt => attempt.finalBand !== null && attempt.finalBand !== undefined)
    } else if (filters.status === 'pending') {
      filtered = filtered.filter(attempt => attempt.finalBand === null || attempt.finalBand === undefined)
    }

    setFilteredAttempts(filtered)
  }

  const handleGrade = async (attemptId, scores) => {
    try {
      const { adminAPI } = await import('../utils/api')
      await adminAPI.gradeAttempt(attemptId, scores)
      toast.success('Baholash saqlandi')
      loadAttempts()
      setShowDetails(false)
      setSelectedAttempt(null)
    } catch (error) {
      console.error('Error grading:', error)
      toast.error('Baholashda xatolik')
    }
  }

  const handleExportPDF = (attempt) => {
    // In production, this would generate a PDF
    toast.info('PDF eksport funksiyasi tez orada qo\'shiladi')
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
                  <Award className="h-8 w-8" />
                  <span>Baholash</span>
                </h1>
                <p className="text-gray-600">Test natijalarini ko'rish va baholash</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Jami Testlar</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Baholangan</p>
              <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Kutilmoqda</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">O'rtacha Band</p>
              <p className="text-2xl font-bold text-primary-500">{stats.averageBand.toFixed(1)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  placeholder="Qidirish..."
                  className="input-field pl-10"
                />
              </div>
              <select
                value={filters.testType}
                onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
                className="input-field"
              >
                <option value="all">Barcha testlar</option>
                <option value="listening">Listening</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
                <option value="speaking">Speaking</option>
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input-field"
                placeholder="Dan"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input-field"
                placeholder="Gacha"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field"
              >
                <option value="all">Barcha holatlar</option>
                <option value="graded">Baholangan</option>
                <option value="pending">Kutilmoqda</option>
              </select>
            </div>
          </div>

          {/* Attempts Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-bold">Foydalanuvchi</th>
                    <th className="text-left p-4 font-bold">Test ID</th>
                    <th className="text-left p-4 font-bold">Sana</th>
                    <th className="text-left p-4 font-bold">Band Score</th>
                    <th className="text-left p-4 font-bold">Holat</th>
                    <th className="text-left p-4 font-bold">Harakatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((attempt) => (
                    <motion.tr
                      key={attempt.attemptId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium">{attempt.userId || 'N/A'}</td>
                      <td className="p-4 text-gray-600 text-sm font-mono">
                        {attempt.attemptId.slice(-8)}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {new Date(attempt.submittedAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {attempt.finalBand ? (
                          <span className="text-2xl font-bold text-primary-500">
                            {attempt.finalBand.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {attempt.finalBand ? (
                          <span className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Baholangan</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span>Kutilmoqda</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAttempt(attempt)
                              setShowDetails(true)
                            }}
                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleExportPDF.bind(null, attempt)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            title="PDF eksport"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredAttempts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Natijalar topilmadi</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Modal */}
          {showDetails && selectedAttempt && (
            <AttemptDetailsModal
              attempt={selectedAttempt}
              onClose={() => {
                setShowDetails(false)
                setSelectedAttempt(null)
              }}
              onGrade={handleGrade}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Attempt Details Modal Component
function AttemptDetailsModal({ attempt, onClose, onGrade }) {
  const [gradingScores, setGradingScores] = useState({
    writing: attempt.manualScores?.writing || attempt.scores?.writing || '',
    speaking: attempt.manualScores?.speaking || attempt.scores?.speaking || '',
  })

  const handleSave = () => {
    const writing = parseFloat(gradingScores.writing)
    const speaking = parseFloat(gradingScores.speaking)

    if (isNaN(writing) && isNaN(speaking)) {
      toast.error('Kamida bitta ball kiriting')
      return
    }

    if ((writing && (writing < 0 || writing > 9)) || (speaking && (speaking < 0 || speaking > 9))) {
      toast.error('Ball 0-9 oralig\'ida bo\'lishi kerak')
      return
    }

    onGrade(attempt.attemptId, {
      writingScore: writing || null,
      speakingScore: speaking || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Test Natijasi Detallari</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            ✕
          </button>
        </div>

        {/* Scores Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Listening</p>
            <p className="text-2xl font-bold text-blue-600">
              {attempt.autoScores?.listeningBand?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              ({attempt.autoScores?.listening || 0}/40)
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Reading</p>
            <p className="text-2xl font-bold text-green-600">
              {attempt.autoScores?.readingBand?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              ({attempt.autoScores?.reading || 0}/40)
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Writing</p>
            <p className="text-2xl font-bold text-yellow-600">
              {attempt.manualScores?.writing?.toFixed(1) || gradingScores.writing || 'Kutilmoqda'}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Speaking</p>
            <p className="text-2xl font-bold text-purple-600">
              {attempt.manualScores?.speaking?.toFixed(1) || gradingScores.speaking || 'Kutilmoqda'}
            </p>
          </div>
        </div>

        {/* Writing Submission */}
        {attempt.answers?.writing && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-3">Writing Javoblari</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Task 1:</p>
                <div
                  className="p-3 bg-white rounded border text-sm prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: attempt.answers.writing.task1 || 'Javob yo\'q' }}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Task 2:</p>
                <div
                  className="p-3 bg-white rounded border text-sm prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: attempt.answers.writing.task2 || 'Javob yo\'q' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Grading Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-4">Baholash</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Writing Score (0-9)
              </label>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={gradingScores.writing}
                onChange={(e) => setGradingScores({ ...gradingScores, writing: e.target.value })}
                className="input-field"
                placeholder="7.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speaking Score (0-9)
              </label>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={gradingScores.speaking}
                onChange={(e) => setGradingScores({ ...gradingScores, speaking: e.target.value })}
                className="input-field"
                placeholder="7.0"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button onClick={handleSave} className="btn-primary flex-1">
            Saqlash
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Yopish
          </button>
        </div>
      </motion.div>
    </div>
  )
}


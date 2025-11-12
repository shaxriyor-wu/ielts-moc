import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { testsAPI, resultsAPI } from '../utils/api'
import { motion } from 'framer-motion'
import { Play, Clock, Award, TrendingUp, BookOpen, Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [tests, setTests] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    attempts: 0,
    averageBand: null,
    lastScore: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log('Dashboard: Loading data...')
      const [testsData, resultsData] = await Promise.all([
        testsAPI.getAll(),
        resultsAPI.getAll(),
      ])
      console.log('Dashboard: Data loaded', { testsData, resultsData })
      
      // Ensure testsData is an array
      const testsArray = Array.isArray(testsData) ? testsData : []
      setTests(testsArray)
      
      // Ensure resultsData is an array
      const resultsArray = Array.isArray(resultsData) ? resultsData : []
      setResults(resultsArray)

      // Calculate stats
      const completedResults = resultsArray.filter((r) => r && r.finalBand !== null && r.finalBand !== undefined)
      const bands = completedResults.map((r) => r.finalBand).filter((b) => b !== null && b !== undefined)
      const average = bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : null

      setStats({
        attempts: completedResults.length,
        averageBand: average ? Math.round(average * 10) / 10 : null,
        lastScore: completedResults.length > 0 ? completedResults[0].finalBand : null,
      })
    } catch (error) {
      console.error('Dashboard: Error loading data', error)
      toast.error('Failed to load dashboard data: ' + (error.message || 'Unknown error'))
      // Set empty arrays on error so UI still renders
      setTests([])
      setResults([])
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600">Choose a mock test to practice your IELTS skills</p>
          </div>
          <Link
            to="/join-test"
            className="btn-primary flex items-center space-x-2"
          >
            <Key className="h-5 w-5" />
            <span>Testga Qo'shilish</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.attempts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-100 rounded-lg">
              <Award className="h-6 w-6 text-accent-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Band</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageBand ? stats.averageBand.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.lastScore ? stats.lastScore.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Available Tests */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Mock Tests</h2>
        {tests.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No tests available at the moment.</p>
            <p className="text-sm text-gray-500 mt-2">Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test, idx) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{test.description}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Clock className="h-4 w-4" />
                <span>{test.duration} minutes</span>
              </div>
              <Link
                to={`/test/${test.id}`}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>Start Test</span>
              </Link>
            </motion.div>
          ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Results</h2>
          <div className="card">
            <div className="space-y-4">
              {results.slice(0, 5).map((result) => (
                <div
                  key={result.attemptId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Attempt #{result.attemptId.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(result.submittedAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {result.finalBand && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-500">
                          {result.finalBand.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600">Band Score</p>
                      </div>
                    )}
                    <Link
                      to={`/results/${result.attemptId}`}
                      className="btn-secondary text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


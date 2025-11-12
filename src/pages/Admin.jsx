import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI, resultsAPI, testsAPI } from '../utils/api'
import { motion } from 'framer-motion'
import { Upload, Download, FileText, Users, Award, Plus, Play, Pause } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Admin() {
  const [attempts, setAttempts] = useState([])
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [gradingScores, setGradingScores] = useState({ writing: '', speaking: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAttempts()
  }, [])

  const loadAttempts = async () => {
    try {
      // In production, this would be /api/admin/attempts
      const results = await resultsAPI.getAll()
      setAttempts(results)
    } catch (error) {
      toast.error('Failed to load attempts')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await adminAPI.exportCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ielts-attempts-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Export successful')
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const handleGrade = async () => {
    if (!selectedAttempt) return

    const writing = parseFloat(gradingScores.writing)
    const speaking = parseFloat(gradingScores.speaking)

    if (isNaN(writing) || isNaN(speaking) || writing < 0 || writing > 9 || speaking < 0 || speaking > 9) {
      toast.error('Please enter valid scores (0-9)')
      return
    }

    try {
      await adminAPI.gradeAttempt(selectedAttempt.attemptId, {
        writingScore: writing,
        speakingScore: speaking,
      })
      toast.success('Scores updated successfully')
      setSelectedAttempt(null)
      setGradingScores({ writing: '', speaking: '' })
      loadAttempts()
    } catch (error) {
      toast.error('Failed to update scores')
    }
  }

  const handleUploadTest = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const testData = {
      title: formData.get('title'),
      description: formData.get('description'),
      duration: parseInt(formData.get('duration')),
      files: Array.from(e.target.files.files || []),
    }

    try {
      await adminAPI.uploadTest(testData)
      toast.success('Test uploaded successfully')
      e.target.reset()
    } catch (error) {
      toast.error('Failed to upload test')
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage tests and grade submissions</p>
        </div>
        <Link to="/admin/create-test" className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Yangi Test Yaratish</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Faol Testlar</span>
            </h2>
            <div className="space-y-3">
              {(() => {
                const tests = JSON.parse(localStorage.getItem('admin_tests') || '[]')
                return tests.length > 0 ? (
                  tests.map((test) => (
                    <div key={test.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{test.title}</p>
                          <p className="text-sm text-gray-600">Kod: {test.code}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(test.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const activeTests = JSON.parse(localStorage.getItem('active_tests') || '[]')
                              if (!activeTests.includes(test.code)) {
                                activeTests.push(test.code)
                                localStorage.setItem('active_tests', JSON.stringify(activeTests))
                                toast.success('Test faollashtirildi!')
                              } else {
                                toast.info('Test allaqachon faol')
                              }
                            }}
                            className="btn-primary text-sm flex items-center space-x-1"
                          >
                            <Play className="h-4 w-4" />
                            <span>Testni Boshlash</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Hozircha testlar yo'q</p>
                )
              })()}
            </div>
          </motion.div>

          {/* Foydalanuvchilar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Foydalanuvchilar va Natijalar</span>
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(() => {
                const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
                const results = JSON.parse(localStorage.getItem('mock_results') || '[]')
                
                // Combine participants with their results
                const usersWithResults = participants.map(participant => {
                  const userResults = results.filter(r => r.userId === participant.userId || r.userId === participant.id)
                  return {
                    ...participant,
                    results: userResults,
                    latestResult: userResults.length > 0 ? userResults[0] : null,
                  }
                })

                return usersWithResults.length > 0 ? (
                  usersWithResults.map((user) => (
                    <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold">{user.fullName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </div>
                        {user.latestResult && (
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-500">
                              {user.latestResult.finalBand?.toFixed(1) || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600">Band Score</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          Testlar soni: {user.results.length} | 
                          Qo'shilgan: {new Date(user.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Hozircha foydalanuvchilar yo'q</p>
                )
              })()}
            </div>
          </motion.div>

          {/* Old Upload Test - Hidden for now */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card hidden"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Upload className="h-6 w-6" />
              <span>Upload New Test</span>
            </h2>
            <form onSubmit={handleUploadTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="input-field"
                  placeholder="IELTS Mock Test 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  className="input-field min-h-[100px]"
                  placeholder="Test description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  required
                  min="1"
                  className="input-field"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Files (JSON + Audio)
                </label>
                <input
                  type="file"
                  name="files"
                  multiple
                  accept=".json,.mp3,.wav"
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Upload Test
              </button>
            </form>
          </motion.div>

          {/* Attempts List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span>Test Attempts</span>
              </h2>
              <button onClick={handleExport} className="btn-secondary flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Export CSV</span>
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attempts.map((attempt) => (
                <div
                  key={attempt.attemptId}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedAttempt(attempt)
                    setGradingScores({
                      writing: attempt.manualScores?.writing || '',
                      speaking: attempt.manualScores?.speaking || '',
                    })
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Attempt #{attempt.attemptId.slice(-6)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(attempt.submittedAt || Date.now()).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {attempt.finalBand ? (
                        <p className="text-2xl font-bold text-primary-500">
                          {attempt.finalBand.toFixed(1)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Pending</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Grading Panel */}
        <div className="lg:col-span-1">
          {selectedAttempt ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card sticky top-20"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Award className="h-6 w-6" />
                <span>Manual Grading</span>
              </h2>
              <div className="space-y-4">
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
                    onChange={(e) =>
                      setGradingScores({ ...gradingScores, writing: e.target.value })
                    }
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
                    onChange={(e) =>
                      setGradingScores({ ...gradingScores, speaking: e.target.value })
                    }
                    className="input-field"
                    placeholder="7.0"
                  />
                </div>
                <div className="flex space-x-2">
                  <button onClick={handleGrade} className="btn-primary flex-1">
                    Save Scores
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAttempt(null)
                      setGradingScores({ writing: '', speaking: '' })
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
                {selectedAttempt.answers?.writing && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Writing Submissions:</p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary-500">View Task 1</summary>
                      <div className="mt-2 p-2 bg-white rounded text-xs max-h-32 overflow-y-auto">
                        {selectedAttempt.answers.writing.task1 || 'No submission'}
                      </div>
                    </details>
                    <details className="text-sm mt-2">
                      <summary className="cursor-pointer text-primary-500">View Task 2</summary>
                      <div className="mt-2 p-2 bg-white rounded text-xs max-h-32 overflow-y-auto">
                        {selectedAttempt.answers.writing.task2 || 'No submission'}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center text-gray-500"
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Select an attempt to grade</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}


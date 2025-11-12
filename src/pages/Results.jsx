import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { resultsAPI, testsAPI } from '../utils/api'
import { convertToBand, calculateOverallBand, autoGradeAnswers } from '../utils/scoring'
import { motion } from 'framer-motion'
import { Award, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Results() {
  const { attemptId } = useParams()
  const [result, setResult] = useState(null)
  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    loadResult()
  }, [attemptId])

  useEffect(() => {
    // Poll for results if still processing
    if (result && result.status === 'processing' && !polling) {
      setPolling(true)
      const interval = setInterval(async () => {
        try {
          const updated = await resultsAPI.getById(attemptId)
          setResult(updated)
          if (updated.status !== 'processing') {
            clearInterval(interval)
            setPolling(false)
          }
        } catch (error) {
          clearInterval(interval)
          setPolling(false)
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [result, attemptId, polling])

  const loadResult = async () => {
    try {
      const resultData = await resultsAPI.getById(attemptId)
      setResult(resultData)

      if (resultData.testId) {
        const testData = await testsAPI.getById(resultData.testId)
        setTest(testData)
      }
    } catch (error) {
      toast.error('Failed to load results')
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

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <p className="text-gray-600">Results not found</p>
          <Link to="/dashboard" className="btn-primary mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const overallBand = result.finalBand || calculateOverallBand({
    listening: result.autoScores?.listeningBand,
    reading: result.autoScores?.readingBand,
    writing: result.manualScores?.writing,
    speaking: result.manualScores?.speaking,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="card text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
          <p className="text-gray-600">
            Attempt ID: {attemptId.slice(-8)}
          </p>
          {result.status === 'processing' && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
              <Clock className="h-5 w-5 animate-spin" />
              <span>Results are being processed. This page will update automatically.</span>
            </div>
          )}
        </div>

        {/* Overall Band Score */}
        {overallBand && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center"
          >
            <Award className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-2">Overall Band Score</h2>
            <p className="text-6xl font-bold">{overallBand.toFixed(1)}</p>
          </motion.div>
        )}

        {/* Component Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Listening */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span>Listening</span>
            </h3>
            {result.autoScores?.listeningBand ? (
              <div>
                <p className="text-3xl font-bold text-primary-500 mb-2">
                  {result.autoScores.listeningBand.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">
                  Raw Score: {result.autoScores.listening} / 40
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Processing...</p>
            )}
          </motion.div>

          {/* Reading */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span>Reading</span>
            </h3>
            {result.autoScores?.readingBand ? (
              <div>
                <p className="text-3xl font-bold text-primary-500 mb-2">
                  {result.autoScores.readingBand.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">
                  Raw Score: {result.autoScores.reading} / 40
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Processing...</p>
            )}
          </motion.div>

          {/* Writing */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              {result.manualScores?.writing ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-500" />
              )}
              <span>Writing</span>
            </h3>
            {result.manualScores?.writing ? (
              <p className="text-3xl font-bold text-primary-500">
                {result.manualScores.writing.toFixed(1)}
              </p>
            ) : (
              <div>
                <p className="text-gray-500 mb-2">Awaiting manual grading</p>
                <p className="text-xs text-gray-400">
                  Your writing will be reviewed by an examiner.
                </p>
              </div>
            )}
          </motion.div>

          {/* Speaking */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              {result.manualScores?.speaking ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-500" />
              )}
              <span>Speaking</span>
            </h3>
            {result.manualScores?.speaking ? (
              <p className="text-3xl font-bold text-primary-500">
                {result.manualScores.speaking.toFixed(1)}
              </p>
            ) : (
              <div>
                <p className="text-gray-500 mb-2">Awaiting manual grading</p>
                <p className="text-xs text-gray-400">
                  Your speaking will be reviewed by an examiner.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Detailed Breakdown */}
        {result.autoScores && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Listening</span>
                <span className="text-primary-500 font-bold">
                  {result.autoScores.listening} / 40
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Reading</span>
                <span className="text-primary-500 font-bold">
                  {result.autoScores.reading} / 40
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <Link to="/dashboard" className="btn-primary flex-1 text-center">
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-secondary flex-1"
          >
            Print Results
          </button>
        </div>
      </motion.div>
    </div>
  )
}


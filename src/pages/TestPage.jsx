import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { testsAPI } from '../utils/api'
import { saveAutosave, getAutosave } from '../utils/storage'
import Timer from '../components/Timer'
import AudioPlayer from '../components/AudioPlayer'
import QuestionRenderer from '../components/QuestionRenderer'
import RichEditor from '../components/RichEditor'
import RecordingControl from '../components/RecordingControl'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const SECTIONS = ['listening', 'reading', 'writing', 'speaking']

export default function TestPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [test, setTest] = useState(null)
  const [currentSection, setCurrentSection] = useState('listening')
  const [answers, setAnswers] = useState({
    listening: [],
    reading: [],
    writing: { task1: '', task2: '' },
    speaking: null,
  })
  const [testStartTime, setTestStartTime] = useState(null)
  const [totalTime, setTotalTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState('saved')

  useEffect(() => {
    loadTest()
    loadAutosave()
  }, [id])

  useEffect(() => {
    if (test) {
      setTotalTime(test.duration * 60)
      setTestStartTime(Date.now())
    }
  }, [test])

  // Autosave every 30 seconds
  useEffect(() => {
    if (!test) return

    const interval = setInterval(() => {
      performAutosave()
    }, 30000)

    return () => clearInterval(interval)
  }, [test, answers])

  const loadTest = async () => {
    try {
      const testData = await testsAPI.getById(id)
      setTest(testData)
      // Initialize answers array
      const listeningCount = testData.sections?.listening?.reduce(
        (acc, section) => acc + section.questions.length,
        0
      ) || 0
      const readingCount = testData.sections?.reading?.reduce(
        (acc, passage) => acc + passage.questions.length,
        0
      ) || 0

      setAnswers({
        listening: new Array(listeningCount).fill(''),
        reading: new Array(readingCount).fill(''),
        writing: { task1: '', task2: '' },
        speaking: null,
      })
    } catch (error) {
      toast.error('Failed to load test')
      navigate('/dashboard')
    }
  }

  const loadAutosave = () => {
    const saved = getAutosave(id)
    if (saved && saved.answers) {
      setAnswers(saved.answers)
      if (saved.currentSection) {
        setCurrentSection(saved.currentSection)
      }
    }
  }

  const performAutosave = async () => {
    try {
      saveAutosave(id, {
        answers,
        currentSection,
        timestamp: Date.now(),
      })

      // Also send to API
      await testsAPI.autosave(id, {
        userId: user?.id || 'current-user',
        data: {
          writingDraft: answers.writing,
          progress: {
            currentSection,
            answersCount: {
              listening: answers.listening.filter((a) => a).length,
              reading: answers.reading.filter((a) => a).length,
            },
          },
        },
      })

      setAutosaveStatus('saved')
    } catch (error) {
      setAutosaveStatus('error')
    }
  }

  const handleAnswerChange = (section, questionIndex, value) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev }
      if (section === 'listening' || section === 'reading') {
        newAnswers[section] = [...prev[section]]
        newAnswers[section][questionIndex] = value
      } else if (section === 'writing') {
        newAnswers.writing = { ...prev.writing, [questionIndex]: value }
      } else if (section === 'speaking') {
        newAnswers.speaking = value
      }
      setAutosaveStatus('saving')
      return newAnswers
    })
  }

  const handleSubmit = async () => {
    if (
      !window.confirm(
        'Are you sure you want to submit? You will not be able to change your answers after submission.'
      )
    ) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await testsAPI.submit(id, {
        userId: user?.id || 'current-user',
        answers,
      })

      toast.success('Test submitted successfully!')
      navigate(`/results/${response.attemptId}`)
    } catch (error) {
      toast.error('Failed to submit test. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleTimeUp = () => {
    toast.error('Time is up! Submitting automatically...')
    handleSubmit()
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  const getQuestionIndex = (section, itemIndex, questionIndex) => {
    if (section === 'listening') {
      let idx = 0
      for (let i = 0; i < itemIndex; i++) {
        idx += test.sections.listening[i].questions.length
      }
      return idx + questionIndex
    } else if (section === 'reading') {
      let idx = 0
      for (let i = 0; i < itemIndex; i++) {
        idx += test.sections.reading[i].questions.length
      }
      return idx + questionIndex
    }
    return questionIndex
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Timer
                initialSeconds={totalTime}
                onComplete={handleTimeUp}
                autoStart={true}
              />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {autosaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Saved</span>
                  </>
                )}
                {autosaveStatus === 'saving' && (
                  <>
                    <Save className="h-4 w-4 text-blue-500 animate-spin" />
                    <span>Saving...</span>
                  </>
                )}
                {autosaveStatus === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Save failed</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-danger"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 bg-white rounded-lg shadow-md p-4 h-fit lg:sticky lg:top-20">
          <nav className="space-y-2" role="navigation" aria-label="Test sections">
            {SECTIONS.map((section) => (
              <button
                key={section}
                onClick={() => setCurrentSection(section)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentSection === section
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-current={currentSection === section ? 'page' : undefined}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {currentSection === 'listening' && (
            <ListeningSection
              sections={test.sections.listening}
              answers={answers.listening}
              onChange={(idx, value) => handleAnswerChange('listening', idx, value)}
              getQuestionIndex={getQuestionIndex}
            />
          )}

          {currentSection === 'reading' && (
            <ReadingSection
              passages={test.sections.reading}
              answers={answers.reading}
              onChange={(idx, value) => handleAnswerChange('reading', idx, value)}
              getQuestionIndex={getQuestionIndex}
            />
          )}

          {currentSection === 'writing' && (
            <WritingSection
              tasks={test.sections.writing}
              answers={answers.writing}
              onChange={(task, value) => handleAnswerChange('writing', task, value)}
            />
          )}

          {currentSection === 'speaking' && (
            <SpeakingSection
              answers={answers.speaking}
              onChange={(value) => handleAnswerChange('speaking', null, value)}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// Listening Section Component
function ListeningSection({ sections, answers, onChange, getQuestionIndex }) {
  return (
    <div className="space-y-6">
      {sections.map((section, sectionIdx) => {
        const audioUrl =
          import.meta.env.VITE_UPLOADS_BASE_URL + section.audio ||
          section.audio ||
          '/assets/audio/demo-part1.mp3'

        return (
          <motion.div
            key={sectionIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4">Section {section.section}</h2>
            <AudioPlayer audioUrl={audioUrl} allowReplay={false} />
            <div className="mt-6 space-y-6">
              {section.questions.map((question, qIdx) => {
                const globalIdx = getQuestionIndex('listening', sectionIdx, qIdx)
                return (
                  <div key={question.id} className="border-b pb-4">
                    <p className="font-medium mb-3">
                      {qIdx + 1}. {question.text}
                    </p>
                    <QuestionRenderer
                      question={question}
                      value={answers[globalIdx]}
                      onChange={(value) => onChange(globalIdx, value)}
                    />
                  </div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Reading Section Component
function ReadingSection({ passages, answers, onChange, getQuestionIndex }) {
  return (
    <div className="space-y-6">
      {passages.map((passage, passageIdx) => (
        <motion.div
          key={passage.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">{passage.title}</h2>
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{passage.text}</p>
          </div>
          <div className="mt-6 space-y-6">
            {passage.questions.map((question, qIdx) => {
              const globalIdx = getQuestionIndex('reading', passageIdx, qIdx)
              return (
                <div key={question.id} className="border-b pb-4">
                  <p className="font-medium mb-3">
                    {qIdx + 1}. {question.text}
                  </p>
                  <QuestionRenderer
                    question={question}
                    value={answers[globalIdx]}
                    onChange={(value) => onChange(globalIdx, value)}
                  />
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Writing Section Component
function WritingSection({ tasks, answers, onChange }) {
  const [evaluatingTask1, setEvaluatingTask1] = useState(false)
  const [evaluatingTask2, setEvaluatingTask2] = useState(false)
  const [task1Result, setTask1Result] = useState(null)
  const [task2Result, setTask2Result] = useState(null)

  const handleEvaluate = async (taskNumber, text) => {
    if (!text || text.replace(/<[^>]*>/g, '').trim().length < 50) {
      toast.error('Please write at least 50 words before evaluating')
      return
    }

    if (taskNumber === 1) {
      setEvaluatingTask1(true)
    } else {
      setEvaluatingTask2(true)
    }

    try {
      const { aiAPI } = await import('../utils/api')
      const result = await aiAPI.evaluateWriting(text, taskNumber)
      
      if (taskNumber === 1) {
        setTask1Result(result)
      } else {
        setTask2Result(result)
      }
      
      toast.success('AI evaluation completed!')
    } catch (error) {
      console.error('Evaluation error:', error)
      toast.error('Failed to evaluate. Please try again.')
    } finally {
      if (taskNumber === 1) {
        setEvaluatingTask1(false)
      } else {
        setEvaluatingTask2(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Writing Task 1</h2>
        <p className="text-gray-700 mb-4">{tasks.task1}</p>
        <RichEditor
          value={answers.task1}
          onChange={(value) => onChange('task1', value)}
          minWords={150}
          placeholder="Write your response here (minimum 150 words)..."
        />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => handleEvaluate(1, answers.task1)}
            disabled={evaluatingTask1 || !answers.task1}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {evaluatingTask1 ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Evaluating with AI...</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>Check with DeepSeek AI</span>
              </>
            )}
          </button>
        </div>
        {task1Result && (
          <WritingEvaluationResult result={task1Result} taskNumber={1} />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Writing Task 2</h2>
        <p className="text-gray-700 mb-4">{tasks.task2}</p>
        <RichEditor
          value={answers.task2}
          onChange={(value) => onChange('task2', value)}
          minWords={250}
          placeholder="Write your essay here (minimum 250 words)..."
        />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => handleEvaluate(2, answers.task2)}
            disabled={evaluatingTask2 || !answers.task2}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {evaluatingTask2 ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Evaluating with AI...</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>Check with DeepSeek AI</span>
              </>
            )}
          </button>
        </div>
        {task2Result && (
          <WritingEvaluationResult result={task2Result} taskNumber={2} />
        )}
      </motion.div>
    </div>
  )
}

// Writing Evaluation Result Component
function WritingEvaluationResult({ result, taskNumber }) {
  const scores = result.scores || {}
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200"
    >
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="text-xl font-bold text-gray-900">AI Evaluation - Task {taskNumber}</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ScoreCard
          label="Task Response"
          score={scores.TaskResponse}
          color="blue"
        />
        <ScoreCard
          label="Coherence & Cohesion"
          score={scores.CoherenceCohesion}
          color="green"
        />
        <ScoreCard
          label="Lexical Resource"
          score={scores.LexicalResource}
          color="yellow"
        />
        <ScoreCard
          label="Grammar"
          score={scores.GrammarRangeAccuracy}
          color="purple"
        />
      </div>
      
      <div className="mb-4 p-4 bg-white rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-gray-900">Overall Band Score</span>
          <span className="text-3xl font-bold text-primary-500">
            {scores.OverallBand?.toFixed(1) || 'N/A'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((scores.OverallBand || 0) / 9) * 100}%` }}
          />
        </div>
      </div>
      
      {scores.Feedback && (
        <div className="p-4 bg-white rounded-lg">
          <h4 className="font-bold text-gray-900 mb-2">Feedback:</h4>
          <p className="text-gray-700 leading-relaxed">{scores.Feedback}</p>
        </div>
      )}
    </motion.div>
  )
}

// Score Card Component
function ScoreCard({ label, score, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
  }
  
  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <p className="text-xs font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">{score?.toFixed(1) || 'N/A'}</p>
    </div>
  )
}

// Speaking Section Component
function SpeakingSection({ answers, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h2 className="text-xl font-bold mb-4">Speaking Test</h2>
      <p className="text-gray-700 mb-6">
        Record your response to the speaking prompts. You will have 2 minutes to prepare and speak.
      </p>
      <RecordingControl
        onRecordingComplete={(blob) => {
          // In production, upload blob to server
          // For now, store reference
          onChange(blob)
        }}
        maxDuration={120}
      />
      {answers && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">Recording completed and saved.</p>
        </div>
      )}
    </motion.div>
  )
}


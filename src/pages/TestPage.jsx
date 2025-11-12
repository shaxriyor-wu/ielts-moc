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
      </motion.div>
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


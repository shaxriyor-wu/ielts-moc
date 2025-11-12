import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { Key, User, CheckCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JoinTest() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [testCode, setTestCode] = useState('')
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    email: user?.email || '',
    verificationCode: '',
  })
  const [test, setTest] = useState(null)
  const [waitingForStart, setWaitingForStart] = useState(false)

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    // Find test by code
    const tests = JSON.parse(localStorage.getItem('admin_tests') || '[]')
    const foundTest = tests.find((t) => t.code === testCode.toUpperCase())
    
    if (!foundTest) {
      toast.error('Test kodi topilmadi!')
      return
    }

    // Check if test is active
    const activeTests = JSON.parse(localStorage.getItem('active_tests') || '[]')
    if (!activeTests.includes(foundTest.code)) {
      toast.error('Test hali boshlanmagan! Admin testni boshlashini kuting.')
      setWaitingForStart(true)
      // Check every 3 seconds if test started
      const interval = setInterval(() => {
        const updatedActiveTests = JSON.parse(localStorage.getItem('active_tests') || '[]')
        if (updatedActiveTests.includes(foundTest.code)) {
          clearInterval(interval)
          setWaitingForStart(false)
          setTest(foundTest)
          setStep(2)
          toast.success('Test boshlandi!')
        }
      }, 3000)
      return
    }

    setTest(foundTest)
    setStep(2)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    // Save participant data
    const participants = JSON.parse(localStorage.getItem('test_participants') || '[]')
    const participant = {
      id: `participant-${Date.now()}`,
      testCode: test.code,
      userId: user?.id,
      ...formData,
      joinedAt: new Date().toISOString(),
    }
    participants.push(participant)
    localStorage.setItem('test_participants', JSON.stringify(participants))
    
    toast.success('Ma\'lumotlar saqlandi!')
    setStep(3)
  }

  const handleStartTest = () => {
    if (!test) return
    // Navigate to test page
    navigate(`/test/${test.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        {/* Step 1: Enter Test Code */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <Key className="h-16 w-16 mx-auto mb-4 text-primary-500" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Testga Qo'shilish</h1>
              <p className="text-gray-600">Test kodini kiriting</p>
            </div>

            {waitingForStart ? (
              <div className="text-center py-8">
                <Loader className="h-12 w-12 mx-auto mb-4 text-primary-500 animate-spin" />
                <p className="text-lg font-medium text-gray-900 mb-2">Test hali boshlanmagan</p>
                <p className="text-gray-600">Admin testni boshlashini kuting...</p>
              </div>
            ) : (
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Kodi
                  </label>
                  <input
                    type="text"
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                    required
                    className="input-field text-center text-2xl font-mono font-bold"
                    placeholder="TEST-XXXXXX"
                    maxLength={20}
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Testni Topish
                </button>
              </form>
            )}
          </div>
        )}

        {/* Step 2: Fill Information */}
        {step === 2 && test && (
          <div>
            <div className="text-center mb-8">
              <User className="h-16 w-16 mx-auto mb-4 text-primary-500" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ma'lumotlarni To'ldiring</h1>
              <p className="text-gray-600">Test: {test.title}</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To'liq Ism Familiya
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Ism Familiya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Raqam
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="input-field"
                  placeholder="+998901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasdiqlash Kodi
                </label>
                <input
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                  required
                  className="input-field"
                  placeholder="123456"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Admin tomonidan berilgan tasdiqlash kodini kiriting
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setTest(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Orqaga
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Saqlash va Davom Etish
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Ready to Start */}
        {step === 3 && test && (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tayyor!</h1>
            <p className="text-gray-600 mb-8">
              Ma'lumotlaringiz saqlandi. Testni boshlash uchun quyidagi tugmani bosing.
            </p>
            <button onClick={handleStartTest} className="btn-primary text-lg px-8 py-4">
              Testni Boshlash
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}


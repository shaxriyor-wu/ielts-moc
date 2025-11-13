import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import { motion } from 'framer-motion'
import { Save, Upload, FileText, Headphones, PenTool, CheckCircle, Menu } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateTest() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 120,
    reading: {
      passages: [],
      answers: [],
    },
    listening: {
      sections: [],
      audioFiles: [],
    },
    writing: {
      task1: '',
      task2: '',
    },
  })
  const [generatedCode, setGeneratedCode] = useState(null)

  const handleReadingAdd = () => {
    setTestData({
      ...testData,
      reading: {
        ...testData.reading,
        passages: [...testData.reading.passages, { id: `R${testData.reading.passages.length + 1}`, title: '', text: '', questions: [] }],
        answers: [...testData.reading.answers, []],
      },
    })
  }

  const handleListeningAdd = () => {
    setTestData({
      ...testData,
      listening: {
        ...testData.listening,
        sections: [...testData.listening.sections, { section: testData.listening.sections.length + 1, questions: [] }],
        audioFiles: [...testData.listening.audioFiles, null],
      },
    })
  }

  const handleSaveTest = () => {
    // Generate unique test code
    const code = `TEST-${Date.now().toString(36).toUpperCase()}`
    
    // Save test to localStorage (in production, this would go to backend)
    const tests = JSON.parse(localStorage.getItem('admin_tests') || '[]')
    const newTest = {
      id: `test-${Date.now()}`,
      code,
      ...testData,
      createdAt: new Date().toISOString(),
      status: 'draft',
    }
    tests.push(newTest)
    localStorage.setItem('admin_tests', JSON.stringify(tests))
    
    setGeneratedCode(code)
    toast.success('Test yaratildi! Kod generatsiya qilindi.')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Yangi Test Yaratish</h1>
              <p className="text-gray-600">Test ma'lumotlarini kiriting</p>
            </div>
          </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > s ? <CheckCircle className="h-6 w-6" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Asosiy</span>
          <span>Reading</span>
          <span>Listening</span>
          <span>Writing</span>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="text-xl font-bold mb-4">Asosiy Ma'lumotlar</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Nomi</label>
              <input
                type="text"
                value={testData.title}
                onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                className="input-field"
                placeholder="IELTS Mock Test 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tavsif</label>
              <textarea
                value={testData.description}
                onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="Test haqida qisqacha ma'lumot..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Davomiyligi (daqiqa)</label>
              <input
                type="number"
                value={testData.duration}
                onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) || 120 })}
                className="input-field"
                min="1"
              />
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="btn-primary">
                Keyingi: Reading
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Reading */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Reading Bo'limi</span>
            </h2>
            <button onClick={handleReadingAdd} className="btn-secondary text-sm">
              + Passage Qo'shish
            </button>
          </div>
          <div className="space-y-6">
            {testData.reading.passages.map((passage, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <h3 className="font-bold mb-4">Passage {idx + 1}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sarlavha</label>
                    <input
                      type="text"
                      value={passage.title}
                      onChange={(e) => {
                        const newPassages = [...testData.reading.passages]
                        newPassages[idx].title = e.target.value
                        setTestData({ ...testData, reading: { ...testData.reading, passages: newPassages } })
                      }}
                      className="input-field"
                      placeholder="Passage 1: The History of..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Matn</label>
                    <textarea
                      value={passage.text}
                      onChange={(e) => {
                        const newPassages = [...testData.reading.passages]
                        newPassages[idx].text = e.target.value
                        setTestData({ ...testData, reading: { ...testData.reading, passages: newPassages } })
                      }}
                      className="input-field min-h-[200px]"
                      placeholder="Passage matnini kiriting..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Savollar</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newPassages = [...testData.reading.passages]
                        newPassages[idx].questions.push({
                          id: `Q${newPassages[idx].questions.length + 1}`,
                          type: 'true_false_not_given',
                          text: '',
                        })
                        setTestData({ ...testData, reading: { ...testData.reading, passages: newPassages } })
                      }}
                      className="btn-secondary text-sm mb-2"
                    >
                      + Savol Qo'shish
                    </button>
                    <div className="space-y-2">
                      {passage.questions.map((q, qIdx) => (
                        <div key={qIdx} className="p-3 bg-gray-50 rounded">
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) => {
                              const newPassages = [...testData.reading.passages]
                              newPassages[idx].questions[qIdx].text = e.target.value
                              setTestData({ ...testData, reading: { ...testData.reading, passages: newPassages } })
                            }}
                            className="input-field mb-2"
                            placeholder="Savol matni..."
                          />
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const newPassages = [...testData.reading.passages]
                              newPassages[idx].questions[qIdx].type = e.target.value
                              setTestData({ ...testData, reading: { ...testData.reading, passages: newPassages } })
                            }}
                            className="input-field"
                          >
                            <option value="true_false_not_given">True/False/Not Given</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="matching_headings">Matching Headings</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Javoblar (vergul bilan ajratilgan)</label>
                    <input
                      type="text"
                      value={testData.reading.answers[idx]?.join(', ') || ''}
                      onChange={(e) => {
                        const newAnswers = [...testData.reading.answers]
                        newAnswers[idx] = e.target.value.split(',').map(a => a.trim())
                        setTestData({ ...testData, reading: { ...testData.reading, answers: newAnswers } })
                      }}
                      className="input-field"
                      placeholder="True, False, Not Given, ..."
                    />
                  </div>
                </div>
              </div>
            ))}
            {testData.reading.passages.length === 0 && (
              <p className="text-gray-500 text-center py-8">Passage qo'shish uchun tugmani bosing</p>
            )}
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">
                Orqaga
              </button>
              <button onClick={() => setStep(3)} className="btn-primary">
                Keyingi: Listening
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 3: Listening */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Headphones className="h-6 w-6" />
              <span>Listening Bo'limi</span>
            </h2>
            <button onClick={handleListeningAdd} className="btn-secondary text-sm">
              + Section Qo'shish
            </button>
          </div>
          <div className="space-y-6">
            {testData.listening.sections.map((section, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <h3 className="font-bold mb-4">Section {section.section}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audio Fayl</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const newAudioFiles = [...testData.listening.audioFiles]
                          newAudioFiles[idx] = file
                          setTestData({ ...testData, listening: { ...testData.listening, audioFiles: newAudioFiles } })
                        }
                      }}
                      className="input-field"
                    />
                    {testData.listening.audioFiles[idx] && (
                      <p className="text-sm text-green-600 mt-1">✓ {testData.listening.audioFiles[idx].name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Savollar</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newSections = [...testData.listening.sections]
                        newSections[idx].questions.push({
                          id: `L${idx + 1}Q${newSections[idx].questions.length + 1}`,
                          type: 'short_answer',
                          text: '',
                        })
                        setTestData({ ...testData, listening: { ...testData.listening, sections: newSections } })
                      }}
                      className="btn-secondary text-sm mb-2"
                    >
                      + Savol Qo'shish
                    </button>
                    <div className="space-y-2">
                      {section.questions.map((q, qIdx) => (
                        <div key={qIdx} className="p-3 bg-gray-50 rounded">
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) => {
                              const newSections = [...testData.listening.sections]
                              newSections[idx].questions[qIdx].text = e.target.value
                              setTestData({ ...testData, listening: { ...testData.listening, sections: newSections } })
                            }}
                            className="input-field mb-2"
                            placeholder="Savol matni..."
                          />
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const newSections = [...testData.listening.sections]
                              newSections[idx].questions[qIdx].type = e.target.value
                              setTestData({ ...testData, listening: { ...testData.listening, sections: newSections } })
                            }}
                            className="input-field"
                          >
                            <option value="short_answer">Short Answer</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="multiple_select">Multiple Select</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Javoblar (vergul bilan ajratilgan)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Answer1, Answer2, Answer3, ..."
                    />
                  </div>
                </div>
              </div>
            ))}
            {testData.listening.sections.length === 0 && (
              <p className="text-gray-500 text-center py-8">Section qo'shish uchun tugmani bosing</p>
            )}
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                Orqaga
              </button>
              <button onClick={() => setStep(4)} className="btn-primary">
                Keyingi: Writing
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 4: Writing */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <PenTool className="h-6 w-6" />
            <span>Writing Bo'limi</span>
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task 1 Mavzusi</label>
              <textarea
                value={testData.writing.task1}
                onChange={(e) => setTestData({ ...testData, writing: { ...testData.writing, task1: e.target.value } })}
                className="input-field min-h-[150px]"
                placeholder="The chart below shows... Write at least 150 words."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task 2 Mavzusi</label>
              <textarea
                value={testData.writing.task2}
                onChange={(e) => setTestData({ ...testData, writing: { ...testData.writing, task2: e.target.value } })}
                className="input-field min-h-[150px]"
                placeholder="Some people believe... Write at least 250 words."
              />
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="btn-secondary">
                Orqaga
              </button>
              <button onClick={handleSaveTest} className="btn-primary flex items-center space-x-2">
                <Save className="h-5 w-5" />
                <span>Testni Saqlash</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generated Code Modal */}
      {generatedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold mb-4 text-center">Test Yaratildi!</h3>
            <div className="bg-primary-50 border-2 border-primary-500 rounded-lg p-6 mb-4">
              <p className="text-sm text-gray-600 mb-2 text-center">Test Kodi:</p>
              <p className="text-3xl font-bold text-primary-500 text-center font-mono">{generatedCode}</p>
            </div>
            <p className="text-sm text-gray-600 text-center mb-6">
              Bu kodni studentlarga yuboring. Ular bu kod orqali testga qo'shiladi.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode)
                  toast.success('Kod nusxalandi!')
                }}
                className="btn-secondary flex-1"
              >
                Nusxalash
              </button>
              <button
                onClick={() => {
                  setGeneratedCode(null)
                  navigate('/admin')
                }}
                className="btn-primary flex-1"
              >
                Admin Panelga Qaytish
              </button>
            </div>
          </motion.div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}


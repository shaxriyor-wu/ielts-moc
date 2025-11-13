import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import { motion } from 'framer-motion'
import { FileText, Play, Pause, Edit, Trash2, Copy, Download, Upload, Menu, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminTestManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState(null)

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = () => {
    try {
      const adminTests = JSON.parse(localStorage.getItem('admin_tests') || '[]')
      const activeTests = JSON.parse(localStorage.getItem('active_tests') || '[]')
      
      const testsWithStatus = adminTests.map(test => ({
        ...test,
        isActive: activeTests.includes(test.code),
      }))
      
      setTests(testsWithStatus)
    } catch (error) {
      console.error('Error loading tests:', error)
      toast.error('Testlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = (test) => {
    const activeTests = JSON.parse(localStorage.getItem('active_tests') || '[]')
    
    if (test.isActive) {
      const filtered = activeTests.filter(code => code !== test.code)
      localStorage.setItem('active_tests', JSON.stringify(filtered))
      toast.success('Test deaktivatsiya qilindi')
    } else {
      activeTests.push(test.code)
      localStorage.setItem('active_tests', JSON.stringify(activeTests))
      toast.success('Test faollashtirildi!')
    }
    
    loadTests()
  }

  const handleDelete = (test) => {
    if (window.confirm(`"${test.title}" testini o'chirishni tasdiqlaysizmi?`)) {
      const adminTests = JSON.parse(localStorage.getItem('admin_tests') || '[]')
      const filtered = adminTests.filter(t => t.id !== test.id)
      localStorage.setItem('admin_tests', JSON.stringify(filtered))
      
      // Remove from active tests if exists
      const activeTests = JSON.parse(localStorage.getItem('active_tests') || '[]')
      const filteredActive = activeTests.filter(code => code !== test.code)
      localStorage.setItem('active_tests', JSON.stringify(filteredActive))
      
      toast.success('Test o\'chirildi')
      loadTests()
    }
  }

  const handleDuplicate = (test) => {
    const newTest = {
      ...test,
      id: `test-${Date.now()}`,
      code: `TEST-${Date.now().toString(36).toUpperCase()}`,
      title: `${test.title} (Nusxa)`,
      createdAt: new Date().toISOString(),
    }
    
    const adminTests = JSON.parse(localStorage.getItem('admin_tests') || '[]')
    adminTests.push(newTest)
    localStorage.setItem('admin_tests', JSON.stringify(adminTests))
    
    toast.success('Test nusxalandi')
    loadTests()
  }

  const handleExport = (test) => {
    const dataStr = JSON.stringify(test, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = window.URL.createObjectURL(dataBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-${test.code}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Test eksport qilindi')
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
                  <FileText className="h-8 w-8" />
                  <span>Test Boshqaruvi</span>
                </h1>
                <p className="text-gray-600">Barcha testlarni boshqaring</p>
              </div>
            </div>
            <Link to="/admin/create-test" className="btn-primary flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Yangi Test</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">Kod: <span className="font-mono">{test.code}</span></p>
                    <p className="text-xs text-gray-500">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${test.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {test.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-medium text-gray-600">Holat:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {test.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Davomiyligi: {test.duration || 120} daqiqa</p>
                    <p>Sections: {test.reading ? 'Reading' : ''} {test.listening ? 'Listening' : ''} {test.writing ? 'Writing' : ''}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleActive(test)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-1 ${
                      test.isActive
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {test.isActive ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>To'xtatish</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Faollashtirish</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDuplicate(test)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    title="Nusxalash"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExport(test)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    title="Eksport"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(test)}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600"
                    title="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {tests.length === 0 && (
            <div className="card text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Hozircha testlar yo'q</p>
              <Link to="/admin/create-test" className="btn-primary inline-flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Yangi Test Yaratish</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


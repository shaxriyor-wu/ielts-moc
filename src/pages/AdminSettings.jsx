import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { motion } from 'framer-motion'
import { Settings, Globe, Key, Users, Moon, Sun, Download, Upload, Save, Menu, TestTube } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('platform') // platform, api, admins
  const [settings, setSettings] = useState({
    platform: {
      siteName: 'IELTS CD Mock Platform',
      logo: '',
      domain: '',
      contactEmail: '',
      contactPhone: '',
      language: 'uz',
      theme: 'light',
    },
    api: {
      deepseekKey: '',
      openaiKey: '',
      stripeKey: '',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
    },
  })
  const [admins, setAdmins] = useState([])
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'admin' })

  useEffect(() => {
    loadSettings()
    loadAdmins()
  }, [])

  const loadSettings = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('admin_settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }

  const loadAdmins = async () => {
    try {
      const mockDataModule = await import('../mocks/data/mockData.js')
      const mockUsers = mockDataModule.users || []
      const adminUsers = mockUsers.filter(u => u.role === 'admin')
      setAdmins(adminUsers)
    } catch (error) {
      console.error('Error loading admins:', error)
    }
  }

  const handleSaveSettings = () => {
    localStorage.setItem('admin_settings', JSON.stringify(settings))
    toast.success('Sozlamalar saqlandi')
  }

  const handleTestAPI = async (apiType) => {
    toast.info(`${apiType} API test qilinmoqda...`)
    // In production, test API connection
    setTimeout(() => {
      toast.success(`${apiType} API muvaffaqiyatli ulandi`)
    }, 2000)
  }

  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast.error('Ism va email kiritilishi kerak')
      return
    }

    const admin = {
      id: `admin-${Date.now()}`,
      ...newAdmin,
    }
    setAdmins([...admins, admin])
    setNewAdmin({ name: '', email: '', role: 'admin' })
    toast.success('Admin qo\'shildi')
  }

  const handleBackup = () => {
    // Export all data as JSON
    const data = {
      users: JSON.parse(localStorage.getItem('test_participants') || '[]'),
      results: JSON.parse(localStorage.getItem('mock_results') || '[]'),
      tests: JSON.parse(localStorage.getItem('admin_tests') || '[]'),
      settings,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Backup yaratildi')
  }

  const handleRestore = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.users) localStorage.setItem('test_participants', JSON.stringify(data.users))
        if (data.results) localStorage.setItem('mock_results', JSON.stringify(data.results))
        if (data.tests) localStorage.setItem('admin_tests', JSON.stringify(data.tests))
        if (data.settings) setSettings(data.settings)
        toast.success('Ma\'lumotlar tiklandi')
      } catch (error) {
        toast.error('Backup fayli noto\'g\'ri formatda')
      }
    }
    reader.readAsText(file)
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
                  <Settings className="h-8 w-8" />
                  <span>Sozlamalar</span>
                </h1>
                <p className="text-gray-600">Platforma sozlamalarini boshqaring</p>
              </div>
            </div>
            <button onClick={handleSaveSettings} className="btn-primary flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>Saqlash</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('platform')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'platform'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="h-5 w-5 inline mr-2" />
              Platform Sozlamalari
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'api'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Key className="h-5 w-5 inline mr-2" />
              API va Integratsiya
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'admins'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Admin Foydalanuvchilar
            </button>
          </div>

          {/* Platform Settings */}
          {activeTab === 'platform' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sayt Nomi</label>
                <input
                  type="text"
                  value={settings.platform.siteName}
                  onChange={(e) => setSettings({
                    ...settings,
                    platform: { ...settings.platform, siteName: e.target.value }
                  })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                <input
                  type="text"
                  value={settings.platform.logo}
                  onChange={(e) => setSettings({
                    ...settings,
                    platform: { ...settings.platform, logo: e.target.value }
                  })}
                  className="input-field"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domen</label>
                <input
                  type="text"
                  value={settings.platform.domain}
                  onChange={(e) => setSettings({
                    ...settings,
                    platform: { ...settings.platform, domain: e.target.value }
                  })}
                  className="input-field"
                  placeholder="https://ielts.example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kontakt Email</label>
                  <input
                    type="email"
                    value={settings.platform.contactEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      platform: { ...settings.platform, contactEmail: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kontakt Telefon</label>
                  <input
                    type="tel"
                    value={settings.platform.contactPhone}
                    onChange={(e) => setSettings({
                      ...settings,
                      platform: { ...settings.platform, contactPhone: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Til</label>
                  <select
                    value={settings.platform.language}
                    onChange={(e) => setSettings({
                      ...settings,
                      platform: { ...settings.platform, language: e.target.value }
                    })}
                    className="input-field"
                  >
                    <option value="uz">O'zbek</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mavzu</label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        platform: { ...settings.platform, theme: 'light' }
                      })}
                      className={`p-3 rounded-lg ${settings.platform.theme === 'light' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
                    >
                      <Sun className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        platform: { ...settings.platform, theme: 'dark' }
                      })}
                      className={`p-3 rounded-lg ${settings.platform.theme === 'dark' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
                    >
                      <Moon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>DeepSeek API Key</span>
                  <button
                    onClick={() => handleTestAPI('DeepSeek')}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>Test</span>
                  </button>
                </label>
                <input
                  type="password"
                  value={settings.api.deepseekKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    api: { ...settings.api, deepseekKey: e.target.value }
                  })}
                  className="input-field"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key (Optional)</label>
                <input
                  type="password"
                  value={settings.api.openaiKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    api: { ...settings.api, openaiKey: e.target.value }
                  })}
                  className="input-field"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stripe API Key (To'lov)</label>
                <input
                  type="password"
                  value={settings.api.stripeKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    api: { ...settings.api, stripeKey: e.target.value }
                  })}
                  className="input-field"
                  placeholder="sk_live_..."
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">SMTP Sozlamalari (Email)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.api.smtpHost}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, smtpHost: e.target.value }
                      })}
                      className="input-field"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={settings.api.smtpPort}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, smtpPort: e.target.value }
                      })}
                      className="input-field"
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP User</label>
                    <input
                      type="email"
                      value={settings.api.smtpUser}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, smtpUser: e.target.value }
                      })}
                      className="input-field"
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                    <input
                      type="password"
                      value={settings.api.smtpPassword}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, smtpPassword: e.target.value }
                      })}
                      className="input-field"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Admin Users */}
          {activeTab === 'admins' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Yangi Admin Qo'shish</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    placeholder="Ism"
                    className="input-field"
                  />
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    placeholder="Email"
                    className="input-field"
                  />
                  <div className="flex space-x-2">
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                      className="input-field flex-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="content_manager">Content Manager</option>
                      <option value="support">Support</option>
                    </select>
                    <button onClick={handleAddAdmin} className="btn-primary">
                      Qo'shish
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold mb-4">Admin Foydalanuvchilar</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-bold">Ism</th>
                        <th className="text-left p-4 font-bold">Email</th>
                        <th className="text-left p-4 font-bold">Rol</th>
                        <th className="text-left p-4 font-bold">Harakatlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id} className="border-b">
                          <td className="p-4 font-medium">{admin.name}</td>
                          <td className="p-4 text-gray-600">{admin.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {admin.role === 'admin' ? 'Admin' : admin.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <button className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Backup & Restore */}
          <div className="card mt-6">
            <h2 className="text-xl font-bold mb-4">Backup va Restore</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleBackup}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Backup Yaratish</span>
              </button>
              <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                <span>Backup Tiklash</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


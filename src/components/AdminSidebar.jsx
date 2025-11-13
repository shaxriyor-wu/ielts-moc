import { Link, useLocation } from 'react-router-dom'
import { Users, FileText, Award, Plus, Home, Settings, BarChart3, Bell, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation()

  const menuItems = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Foydalanuvchilar' },
    { path: '/admin/create-test', icon: Plus, label: 'Yangi Test' },
    { path: '/admin/tests', icon: FileText, label: 'Testlar' },
    { path: '/admin/attempts', icon: FileText, label: 'Test Natijalari' },
    { path: '/admin/grading', icon: Award, label: 'Baholash' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Tahlil' },
    { path: '/admin/messages', icon: MessageCircle, label: 'Xabarlar' },
    { path: '/admin/settings', icon: Settings, label: 'Sozlamalar' },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white shadow-lg z-50 w-64 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary-500">Admin Panel</h2>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
}


import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Send, Paperclip, CheckCircle, Clock, Menu, Archive, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminMessages() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all') // all, feedback, complaint, question

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = () => {
    // Mock messages - in production, load from API
    const mockMessages = [
      {
        id: 'msg-1',
        userId: 'user-1',
        userName: 'John Student',
        userEmail: 'student@demo.com',
        category: 'question',
        lastMessage: 'How can I improve my writing score?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        unread: true,
        status: 'open',
      },
      {
        id: 'msg-2',
        userId: 'user-2',
        userName: 'Jane Doe',
        userEmail: 'jane@demo.com',
        category: 'feedback',
        lastMessage: 'Great platform! Very helpful.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        unread: false,
        status: 'resolved',
      },
    ]
    setMessages(mockMessages)
  }

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || msg.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return

    // In production, send to backend
    toast.success('Xabar yuborildi')
    setNewMessage('')
  }

  const handleMarkResolved = (messageId) => {
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, status: 'resolved' } : msg
    ))
    toast.success('Muammo hal etilgan deb belgilandi')
  }

  const handleArchive = (messageId) => {
    setMessages(messages.filter(msg => msg.id !== messageId))
    toast.success('Xabar arxivlandi')
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
                  <MessageCircle className="h-8 w-8" />
                  <span>Xabarlar</span>
                </h1>
                <p className="text-gray-600">Foydalanuvchilar bilan xabar almashish</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users List */}
            <div className="lg:col-span-1">
              <div className="card mb-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Qidirish..."
                    className="input-field pl-10"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="all">Barcha kategoriyalar</option>
                  <option value="question">Savollar</option>
                  <option value="feedback">Feedback</option>
                  <option value="complaint">Shikoyatlar</option>
                </select>
              </div>

              <div className="card max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="space-y-2">
                  {filteredMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedUser(message)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === message.id
                          ? 'bg-primary-500 text-white'
                          : message.unread
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className={`font-bold ${selectedUser?.id === message.id ? 'text-white' : 'text-gray-900'}`}>
                            {message.userName}
                          </p>
                          <p className={`text-sm ${selectedUser?.id === message.id ? 'text-white' : 'text-gray-600'}`}>
                            {message.userEmail}
                          </p>
                        </div>
                        {message.unread && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className={`text-sm mt-2 line-clamp-2 ${
                        selectedUser?.id === message.id ? 'text-white' : 'text-gray-600'
                      }`}>
                        {message.lastMessage}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          selectedUser?.id === message.id ? 'text-white' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          message.category === 'complaint' ? 'bg-red-100 text-red-700' :
                          message.category === 'feedback' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {message.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2">
              {selectedUser ? (
                <div className="card flex flex-col h-[calc(100vh-200px)]">
                  {/* Chat Header */}
                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{selectedUser.userName}</h2>
                        <p className="text-sm text-gray-600">{selectedUser.userEmail}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMarkResolved(selectedUser.id)}
                          className="btn-secondary text-sm flex items-center space-x-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Hal qilindi</span>
                        </button>
                        <button
                          onClick={() => handleArchive(selectedUser.id)}
                          className="btn-secondary text-sm flex items-center space-x-1"
                        >
                          <Archive className="h-4 w-4" />
                          <span>Arxivlash</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {/* User Message */}
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4 max-w-[70%]">
                        <p className="text-gray-900">{selectedUser.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(selectedUser.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Admin Message (example) */}
                    <div className="flex justify-end">
                      <div className="bg-primary-500 text-white rounded-lg p-4 max-w-[70%]">
                        <p>Salom! Qanday yordam bera olaman?</p>
                        <p className="text-xs text-white opacity-75 mt-2">
                          {new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Paperclip className="h-5 w-5 text-gray-600" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Xabar yozing..."
                        className="input-field flex-1"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Send className="h-5 w-5" />
                        <span>Yuborish</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Foydalanuvchini tanlang</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


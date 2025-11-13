import axios from 'axios'
import toast from 'react-hot-toast'
import { users } from '../mocks/data/mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const USE_MOCK = !API_BASE_URL || import.meta.env.MODE === 'development'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For httpOnly cookies
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          })
          const { token } = response.data
          localStorage.setItem('auth_token', token)
          // Retry original request
          error.config.headers.Authorization = `Bearer ${token}`
          return api.request(error.config)
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('auth_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Mock login function (fallback if MSW doesn't work)
const mockLogin = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('mockLogin: Checking credentials', { email })
      console.log('mockLogin: Available users', users.map(u => ({ email: u.email, role: u.role })))
      const user = users.find((u) => u.email === email && u.password === password)
      if (!user) {
        console.log('mockLogin: User not found or password mismatch')
        reject({
          response: {
            data: { message: 'Invalid credentials' },
            status: 401,
          },
        })
        return
      }
      const { password: _, ...userWithoutPassword } = user
      const response = {
        token: `mock-token-${user.id}`,
        refreshToken: `mock-refresh-${user.id}`,
        user: userWithoutPassword,
      }
      console.log('mockLogin: Success', response)
      resolve(response)
    }, 300) // Simulate network delay
  })
}

// API methods following the contract
export const authAPI = {
  login: async (email, password) => {
    // If using mock mode and MSW might not work, use direct mock
    if (USE_MOCK) {
      try {
        // Try real API first (in case MSW is working)
        const response = await api.post('/api/auth/login', { email, password })
        return response.data
      } catch (error) {
        // If 404 or network error, use direct mock
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          console.log('🔄 MSW not available, using direct mock login')
          return await mockLogin(email, password)
        }
        throw error
      }
    } else {
      // Real API
      const response = await api.post('/api/auth/login', { email, password })
      return response.data
    }
  },
  register: async (name, email, password) => {
    if (USE_MOCK) {
      try {
        const response = await api.post('/api/auth/register', { name, email, password })
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Mock register
          if (users.find((u) => u.email === email)) {
            throw {
              response: {
                data: { message: 'Email already exists' },
                status: 400,
              },
            }
          }
          const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: 'student',
          }
          users.push({ ...newUser, password })
          return { success: true, user: newUser }
        }
        throw error
      }
    } else {
      const response = await api.post('/api/auth/register', { name, email, password })
      return response.data
    }
  },
  getProfile: async () => {
    if (USE_MOCK) {
      try {
        const response = await api.get('/api/auth/profile')
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Mock profile - get from token
          const token = localStorage.getItem('auth_token')
          if (!token) {
            throw { response: { status: 401, data: { message: 'Unauthorized' } } }
          }
          const userId = token.replace('mock-token-', '')
          const user = users.find((u) => u.id === userId)
          if (!user) {
            throw { response: { status: 401, data: { message: 'Unauthorized' } } }
          }
          const { password: _, ...userWithoutPassword } = user
          return userWithoutPassword
        }
        throw error
      }
    } else {
      const response = await api.get('/api/auth/profile')
      return response.data
    }
  },
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/auth/refresh', { refreshToken })
    return response.data
  },
}

// Import mock data lazily
let demoTest = null
let answerKey = null

const loadDemoTest = async () => {
  if (!demoTest) {
    const module = await import('../mocks/data/demo-1.json')
    demoTest = module.default
  }
  return demoTest
}

const loadAnswerKey = async () => {
  if (!answerKey) {
    const module = await import('../mocks/data/answer-keys/demo-1.json')
    answerKey = module.default
  }
  return answerKey
}

export const testsAPI = {
  getAll: async () => {
    if (USE_MOCK) {
      try {
        console.log('testsAPI.getAll: Trying API request...')
        const response = await api.get('/api/tests')
        console.log('testsAPI.getAll: API success', response.data)
        const data = response.data
        // Ensure we return an array
        return Array.isArray(data) ? data : []
      } catch (error) {
        console.log('testsAPI.getAll: API failed, using mock', error.response?.status || error.code)
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Mock tests list
          console.log('testsAPI.getAll: Loading mock test data...')
          const test = await loadDemoTest()
          const mockData = [
            {
              id: 'demo-1',
              title: test.title,
              description: 'Full IELTS Computer-Delivered Mock Test with all four sections',
              duration: test.duration,
              published: true,
              sections: {
                listening: !!test.sections.listening,
                reading: !!test.sections.reading,
                writing: !!test.sections.writing,
                speaking: !!test.sections.speaking,
              },
            },
          ]
          console.log('testsAPI.getAll: Mock data ready', mockData)
          return mockData
        }
        throw error
      }
    } else {
      const response = await api.get('/api/tests')
      const data = response.data
      return Array.isArray(data) ? data : []
    }
  },
  getById: async (id) => {
    if (USE_MOCK) {
      try {
        const response = await api.get(`/api/tests/${id}`)
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Mock test data
          const test = await loadDemoTest()
          if (id === 'demo-1') {
            return test
          }
          throw { response: { status: 404, data: { message: 'Test not found' } } }
        }
        throw error
      }
    } else {
      const response = await api.get(`/api/tests/${id}`)
      return response.data
    }
  },
  getAnswerKey: async (id) => {
    if (USE_MOCK) {
      try {
        const response = await api.get(`/api/answer-keys/${id}`)
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          const key = await loadAnswerKey()
          if (id === 'demo-1') {
            return key
          }
          throw { response: { status: 404, data: { message: 'Answer key not found' } } }
        }
        throw error
      }
    } else {
      const response = await api.get(`/api/answer-keys/${id}`)
      return response.data
    }
  },
  submit: async (testId, answers) => {
    if (USE_MOCK) {
      try {
        const response = await api.post(`/api/tests/${testId}/submit`, answers)
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Mock submit - auto-grade and return attemptId
          const key = await loadAnswerKey()
          
          const listeningAnswers = answers.listening || []
          const readingAnswers = answers.reading || []
          const listeningKey = key.listening || []
          const readingKey = key.reading || []

          const listeningScore = listeningAnswers.reduce((score, ans, idx) => {
            return score + (ans?.toString().toLowerCase().trim() === listeningKey[idx]?.toString().toLowerCase().trim() ? 1 : 0)
          }, 0)

          const readingScore = readingAnswers.reduce((score, ans, idx) => {
            return score + (ans?.toString().toLowerCase().trim() === readingKey[idx]?.toString().toLowerCase().trim() ? 1 : 0)
          }, 0)

          // Convert to bands
          const convertToBand = (raw) => {
            const table = { 40: 9.0, 39: 8.5, 38: 8.5, 37: 8.0, 36: 8.0, 35: 8.0, 34: 7.5, 33: 7.5, 32: 7.0, 31: 7.0, 30: 7.0, 29: 6.5, 28: 6.5, 27: 6.5, 26: 6.0, 25: 6.0, 24: 6.0, 23: 5.5, 22: 5.5, 21: 5.5, 20: 5.0, 19: 5.0, 18: 5.0, 17: 4.5, 16: 4.5, 15: 4.5, 14: 4.0, 13: 4.0, 12: 4.0, 11: 3.5, 10: 3.5, 9: 3.5, 8: 3.0, 7: 3.0, 6: 3.0, 5: 2.5, 4: 2.5, 3: 2.5, 2: 2.0, 1: 2.0, 0: 1.0 }
            return table[raw] || 0
          }

          const attemptId = `attempt-${Date.now()}`
          
          // Store result in localStorage for mock
          const result = {
            attemptId,
            userId: answers.userId,
            testId,
            submittedAt: new Date().toISOString(),
            answers,
            autoScores: {
              listening: listeningScore,
              listeningBand: convertToBand(listeningScore),
              reading: readingScore,
              readingBand: convertToBand(readingScore),
            },
            manualScores: {
              writing: null,
              speaking: null,
            },
            finalBand: null,
            status: 'processing',
          }
          
          const results = JSON.parse(localStorage.getItem('mock_results') || '[]')
          results.push(result)
          localStorage.setItem('mock_results', JSON.stringify(results))

          return { attemptId, status: 'processing' }
        }
        throw error
      }
    } else {
      const response = await api.post(`/api/tests/${testId}/submit`, answers)
      return response.data
    }
  },
  autosave: async (testId, data) => {
    if (USE_MOCK) {
      try {
        const response = await api.post(`/api/tests/${testId}/autosave`, data)
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Mock autosave - just return success
          return { saved: true, ts: Date.now() }
        }
        throw error
      }
    } else {
      const response = await api.post(`/api/tests/${testId}/autosave`, data)
      return response.data
    }
  },
}

export const resultsAPI = {
  getById: async (attemptId) => {
    if (USE_MOCK) {
      try {
        const response = await api.get(`/api/results/${attemptId}`)
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Get from localStorage
          const results = JSON.parse(localStorage.getItem('mock_results') || '[]')
          const result = results.find((r) => r.attemptId === attemptId)
          if (!result) {
            throw { response: { status: 404, data: { message: 'Result not found' } } }
          }
          return result
        }
        throw error
      }
    } else {
      const response = await api.get(`/api/results/${attemptId}`)
      return response.data
    }
  },
  getAll: async () => {
    if (USE_MOCK) {
      try {
        console.log('resultsAPI.getAll: Trying API request...')
        const response = await api.get('/api/results')
        console.log('resultsAPI.getAll: API success', response.data)
        const data = response.data
        // Ensure we return an array
        return Array.isArray(data) ? data : []
      } catch (error) {
        console.log('resultsAPI.getAll: API failed, using localStorage', error.response?.status || error.code)
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Get from localStorage
          try {
            const stored = localStorage.getItem('mock_results')
            const results = stored ? JSON.parse(stored) : []
            console.log('resultsAPI.getAll: Loaded from localStorage', results)
            // Ensure we return an array
            return Array.isArray(results) ? results : []
          } catch (parseError) {
            console.error('resultsAPI.getAll: Error parsing localStorage', parseError)
            return []
          }
        }
        throw error
      }
    } else {
      const response = await api.get('/api/results')
      const data = response.data
      return Array.isArray(data) ? data : []
    }
  },
}

export const adminAPI = {
  exportCSV: async () => {
    const response = await api.get('/api/admin/export', { responseType: 'blob' })
    return response.data
  },
  gradeAttempt: async (attemptId, scores) => {
    const response = await api.post(`/api/admin/grade/${attemptId}`, scores)
    return response.data
  },
  uploadTest: async (testData) => {
    const formData = new FormData()
    Object.keys(testData).forEach((key) => {
      if (key === 'files' && Array.isArray(testData[key])) {
        testData[key].forEach((file) => {
          formData.append('files', file)
        })
      } else {
        formData.append(key, testData[key])
      }
    })
    const response = await api.post('/api/admin/tests/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export const aiAPI = {
  evaluateWriting: async (text, taskNumber = 1) => {
    if (USE_MOCK) {
      try {
        const response = await api.post('/api/evaluate-writing', { text, task: taskNumber })
        return response.data
      } catch (error) {
        if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
          // Mock evaluation for development
          return {
            success: true,
            scores: {
              TaskResponse: 7.0,
              CoherenceCohesion: 6.5,
              LexicalResource: 7.0,
              GrammarRangeAccuracy: 6.5,
              OverallBand: 6.75,
              Feedback: 'Good structure and vocabulary. However, there are some grammatical errors and the coherence could be improved. Try to use more linking words and complex sentence structures.',
            },
            evaluationId: `eval-${Date.now()}`,
          }
        }
        throw error
      }
    } else {
      const response = await api.post('/api/evaluate-writing', { text, task: taskNumber })
      return response.data
    }
  },
  getWritingResults: async () => {
    const response = await api.get('/api/writing-results')
    return response.data
  },
}

export default api


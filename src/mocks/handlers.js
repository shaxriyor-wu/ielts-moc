import { http, HttpResponse } from 'msw'
import demoTest from './data/demo-1.json'
import answerKey from './data/answer-keys/demo-1.json'
import { users, attempts, results } from './data/mockData'

const API_BASE = '/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    try {
      const { email, password } = await request.json()
      console.log('MSW: Login request received', { email, password })
      console.log('MSW: Available users', users.map(u => ({ email: u.email, hasPassword: !!u.password })))
      
      const user = users.find((u) => u.email === email && u.password === password)
      
      if (!user) {
        console.log('MSW: User not found or password mismatch')
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        )
      }

      const { password: _, ...userWithoutPassword } = user
      const response = {
        token: `mock-token-${user.id}`,
        refreshToken: `mock-refresh-${user.id}`,
        user: userWithoutPassword,
      }
      console.log('MSW: Login successful', response)
      return HttpResponse.json(response)
    } catch (error) {
      console.error('MSW: Login handler error', error)
      return HttpResponse.json(
        { message: 'Server error' },
        { status: 500 }
      )
    }
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const { name, email, password } = await request.json()

    if (users.find((u) => u.email === email)) {
      return HttpResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      )
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: 'student',
    }

    users.push({ ...newUser, password })
    return HttpResponse.json({ success: true, user: newUser })
  }),

  http.get(`${API_BASE}/auth/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const userId = token?.replace('mock-token-', '')

    const user = users.find((u) => u.id === userId)
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { password: _, ...userWithoutPassword } = user
    return HttpResponse.json(userWithoutPassword)
  }),

  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const { refreshToken } = await request.json()
    const userId = refreshToken?.replace('mock-refresh-', '')

    if (!userId) {
      return HttpResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    return HttpResponse.json({
      token: `mock-token-${userId}`,
    })
  }),

  // Tests endpoints
  http.get(`${API_BASE}/tests`, () => {
    return HttpResponse.json([
      {
        id: 'demo-1',
        title: demoTest.title,
        description: 'Full IELTS Computer-Delivered Mock Test with all four sections',
        duration: demoTest.duration,
        published: true,
        sections: {
          listening: demoTest.sections.listening ? true : false,
          reading: demoTest.sections.reading ? true : false,
          writing: demoTest.sections.writing ? true : false,
          speaking: demoTest.sections.speaking ? true : false,
        },
      },
    ])
  }),

  http.get(`${API_BASE}/tests/:id`, ({ params }) => {
    const { id } = params
    if (id === 'demo-1') {
      return HttpResponse.json(demoTest)
    }
    return HttpResponse.json({ message: 'Test not found' }, { status: 404 })
  }),

  http.get(`${API_BASE}/answer-keys/:id`, ({ params }) => {
    const { id } = params
    if (id === 'demo-1') {
      return HttpResponse.json(answerKey)
    }
    return HttpResponse.json({ message: 'Answer key not found' }, { status: 404 })
  }),

  http.post(`${API_BASE}/tests/:id/submit`, async ({ params, request }) => {
    const { id } = params
    const { userId, answers } = await request.json()

    // Auto-grade Listening and Reading
    const listeningAnswers = answers.listening || []
    const readingAnswers = answers.reading || []
    const listeningKey = answerKey.listening || []
    const readingKey = answerKey.reading || []

    const listeningScore = listeningAnswers.reduce((score, ans, idx) => {
      return score + (ans?.toString().toLowerCase().trim() === listeningKey[idx]?.toString().toLowerCase().trim() ? 1 : 0)
    }, 0)

    const readingScore = readingAnswers.reduce((score, ans, idx) => {
      return score + (ans?.toString().toLowerCase().trim() === readingKey[idx]?.toString().toLowerCase().trim() ? 1 : 0)
    }, 0)

    // Convert to bands (simplified conversion)
    const listeningBand = convertToBand(listeningScore)
    const readingBand = convertToBand(readingScore)

    const attemptId = `attempt-${Date.now()}`
    const result = {
      attemptId,
      userId,
      testId: id,
      submittedAt: new Date().toISOString(),
      answers,
      autoScores: {
        listening: listeningScore,
        listeningBand,
        reading: readingScore,
        readingBand,
      },
      manualScores: {
        writing: null,
        speaking: null,
      },
      finalBand: null,
      status: 'processing',
    }

    results.push(result)
    attempts.push({ ...result, id: attemptId })

    return HttpResponse.json({ attemptId, status: 'processing' })
  }),

  http.post(`${API_BASE}/tests/:id/autosave`, async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({ saved: true, ts: Date.now() })
  }),

  // Results endpoints
  http.get(`${API_BASE}/results`, () => {
    return HttpResponse.json(results)
  }),

  http.get(`${API_BASE}/results/:attemptId`, ({ params }) => {
    const { attemptId } = params
    const result = results.find((r) => r.attemptId === attemptId)

    if (!result) {
      return HttpResponse.json({ message: 'Result not found' }, { status: 404 })
    }

    return HttpResponse.json(result)
  }),

  // Admin endpoints
  http.get(`${API_BASE}/admin/export`, () => {
    // Generate CSV content
    const csvHeader = 'Attempt ID,User ID,Test ID,Listening,Reading,Writing,Speaking,Final Band,Submitted At\n'
    const csvRows = results.map((r) => {
      return [
        r.attemptId,
        r.userId,
        r.testId,
        r.autoScores?.listening || '',
        r.autoScores?.reading || '',
        r.manualScores?.writing || '',
        r.manualScores?.speaking || '',
        r.finalBand || '',
        r.submittedAt || '',
      ].join(',')
    })

    const csv = csvHeader + csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })

    return new HttpResponse(blob, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ielts-attempts.csv"',
      },
    })
  }),

  http.post(`${API_BASE}/admin/grade/:attemptId`, async ({ params, request }) => {
    const { attemptId } = params
    const { writingScore, speakingScore } = await request.json()

    const result = results.find((r) => r.attemptId === attemptId)
    if (!result) {
      return HttpResponse.json({ message: 'Attempt not found' }, { status: 404 })
    }

    result.manualScores = {
      writing: writingScore,
      speaking: speakingScore,
    }

    // Calculate final band
    const overall = (
      (result.autoScores.listeningBand +
        result.autoScores.readingBand +
        writingScore +
        speakingScore) /
      4
    )
    result.finalBand = Math.round(overall * 2) / 2
    result.status = 'completed'

    return HttpResponse.json(result)
  }),

  http.post(`${API_BASE}/admin/tests/upload`, async ({ request }) => {
    // Mock upload - in production, this would save files
    return HttpResponse.json({
      success: true,
      testId: `test-${Date.now()}`,
      message: 'Test uploaded successfully (mock)',
    })
  }),
]

// Helper function to convert raw score to band
function convertToBand(rawScore) {
  const conversionTable = {
    40: 9.0, 39: 8.5, 38: 8.5, 37: 8.0, 36: 8.0, 35: 8.0,
    34: 7.5, 33: 7.5, 32: 7.0, 31: 7.0, 30: 7.0,
    29: 6.5, 28: 6.5, 27: 6.5, 26: 6.0, 25: 6.0, 24: 6.0,
    23: 5.5, 22: 5.5, 21: 5.5, 20: 5.0, 19: 5.0, 18: 5.0,
    17: 4.5, 16: 4.5, 15: 4.5, 14: 4.0, 13: 4.0, 12: 4.0,
    11: 3.5, 10: 3.5, 9: 3.5, 8: 3.0, 7: 3.0, 6: 3.0,
    5: 2.5, 4: 2.5, 3: 2.5, 2: 2.0, 1: 2.0, 0: 1.0,
  }
  return conversionTable[rawScore] || 0
}


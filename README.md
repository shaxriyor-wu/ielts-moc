# IELTS Computer-Delivered Mock Test Platform with DeepSeek AI

A full-stack production-ready platform for IELTS Computer-Delivered (CD) mock tests with **DeepSeek AI integration** for Writing evaluation. Built with React (Vite) frontend and Flask (Python) backend.

## 🚀 Features

### User Panel
- ✅ **Complete Test Interface**: Full IELTS test experience with Listening, Reading, Writing, and Speaking sections
- ✅ **Real-time Timer**: Countdown timer with auto-submit functionality
- ✅ **Auto-save**: Automatic saving of progress every 30 seconds
- ✅ **Auto-grading**: Automatic scoring for Listening and Reading sections
- ✅ **🤖 DeepSeek AI Writing Evaluation**: Real-time AI-powered writing assessment with detailed feedback
- ✅ **Speaking Recording**: Browser-based audio recording for Speaking section
- ✅ **Results Dashboard**: Detailed breakdown with charts and statistics
- ✅ **Profile Management**: Edit personal information

### Admin Panel
- ✅ **Dashboard**: Statistics, charts, and analytics (Recharts)
- ✅ **User Management**: Search, filter, edit, block, delete users
- ✅ **Test Management**: Create, edit, activate/deactivate, duplicate, export tests
- ✅ **Results & Analytics**: View all test results with detailed statistics
- ✅ **AI Evaluation Monitor**: Track all DeepSeek AI evaluations
- ✅ **Speaking Review**: Review and grade speaking submissions
- ✅ **CSV Export**: Export results and user data

### Technical
- ✅ **Full-Stack**: React frontend + Flask backend
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Responsive Design**: Mobile-first, fully responsive interface
- ✅ **Accessibility**: WCAG AA compliant
- ✅ **Mock API**: Works offline with Mock Service Worker (MSW)
- ✅ **Production Ready**: Includes tests, CI/CD, and deployment configs

## 📋 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Quill** - Rich text editor
- **Recharts** - Charts and graphs
- **MSW** - Mock Service Worker for API mocking
- **Jest + React Testing Library** - Unit testing
- **Playwright** - E2E testing

### Backend
- **Flask** - Python web framework
- **Flask-JWT-Extended** - JWT authentication
- **Flask-CORS** - Cross-origin resource sharing
- **Python Requests** - HTTP client for DeepSeek API
- **JSON File Storage** - Simple database (upgradeable to SQLite/PostgreSQL)

## 🛠️ Quick Setup

### Backend (Flask)
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add DEEPSEEK_API_KEY
python app.py
```

### Frontend (React)
```bash
# From project root
npm install
npm run dev
```

**See `SETUP_GUIDE.md` for detailed instructions.**

## 📚 Documentation

- **`SETUP_GUIDE.md`** - Complete setup instructions
- **`README_FULL_STACK.md`** - Full stack documentation
- **`server/README.md`** - Backend API documentation
- **`API_CONTRACT.md`** - API endpoint specifications

   The app will be available at `http://localhost:3000`

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=                    # Leave empty for mock mode, or set to your backend URL
VITE_UPLOADS_BASE_URL=http://localhost:3000/assets  # Base URL for audio files and uploads

# Feature Flags (optional)
VITE_FEATURE_FLAGS=dark-mode,export-pdf
```

### Switching Between Mock and Real Backend

- **Mock Mode** (default): Leave `VITE_API_BASE_URL` empty or unset. The app will use MSW to mock all API calls.
- **Real Backend**: Set `VITE_API_BASE_URL` to your backend API URL (e.g., `https://api.example.com`). MSW will be disabled automatically.

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### E2E Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 🏗️ Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build
```bash
npm run preview
```

## 📚 Project Structure

```
IELTS/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable components
│   │   ├── AudioPlayer.jsx
│   │   ├── Navbar.jsx
│   │   ├── QuestionRenderer.jsx
│   │   ├── RecordingControl.jsx
│   │   ├── RichEditor.jsx
│   │   ├── Timer.jsx
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── mocks/             # Mock API setup
│   │   ├── browser.js
│   │   ├── handlers.js
│   │   └── data/          # Mock data files
│   ├── pages/             # Page components
│   │   ├── Admin.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Results.jsx
│   │   └── TestPage.jsx
│   ├── utils/             # Utility functions
│   │   ├── api.js         # API client
│   │   ├── scoring.js     # Scoring utilities
│   │   └── storage.js     # LocalStorage utilities
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── styles.css         # Global styles
├── e2e/                   # E2E tests
├── .github/workflows/     # CI/CD workflows
└── README.md
```

## 🔌 API Contract

### Authentication

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "user-1",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student"
  }
}
```

#### POST `/api/auth/register`
**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student"
  }
}
```

#### GET `/api/auth/profile`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "user-1",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "student"
}
```

### Tests

#### GET `/api/tests`
**Response:**
```json
[
  {
    "id": "demo-1",
    "title": "Full IELTS Mock Test",
    "description": "Complete test description",
    "duration": 120,
    "published": true,
    "sections": {
      "listening": true,
      "reading": true,
      "writing": true,
      "speaking": true
    }
  }
]
```

#### GET `/api/tests/:id`
**Response:** Full test manifest with all sections and questions

#### GET `/api/answer-keys/:id`
**Response:**
```json
{
  "listening": ["answer1", "answer2", ...],
  "reading": ["answer1", "answer2", ...]
}
```

#### POST `/api/tests/:id/submit`
**Request:**
```json
{
  "userId": "user-1",
  "answers": {
    "listening": ["answer1", "answer2", ...],
    "reading": ["answer1", "answer2", ...],
    "writing": {
      "task1": "essay text...",
      "task2": "essay text..."
    },
    "speaking": "audio-blob-reference"
  }
}
```

**Response:**
```json
{
  "attemptId": "attempt-123456",
  "status": "processing"
}
```

#### POST `/api/tests/:id/autosave`
**Request:**
```json
{
  "userId": "user-1",
  "data": {
    "writingDraft": {
      "task1": "draft text...",
      "task2": "draft text..."
    },
    "progress": {
      "currentSection": "writing",
      "answersCount": {
        "listening": 5,
        "reading": 3
      }
    }
  }
}
```

**Response:**
```json
{
  "saved": true,
  "ts": 1234567890
}
```

### Results

#### GET `/api/results`
**Response:** Array of all user's results

#### GET `/api/results/:attemptId`
**Response:**
```json
{
  "attemptId": "attempt-123456",
  "userId": "user-1",
  "testId": "demo-1",
  "submittedAt": "2024-01-01T00:00:00Z",
  "autoScores": {
    "listening": 35,
    "listeningBand": 8.0,
    "reading": 32,
    "readingBand": 7.0
  },
  "manualScores": {
    "writing": 7.5,
    "speaking": 7.0
  },
  "finalBand": 7.4,
  "status": "completed"
}
```

### Admin

#### GET `/api/admin/export`
**Response:** CSV file download

#### POST `/api/admin/grade/:attemptId`
**Request:**
```json
{
  "writingScore": 7.5,
  "speakingScore": 7.0
}
```

**Response:** Updated result object

#### POST `/api/admin/tests/upload`
**Request:** `multipart/form-data` with test metadata and files

**Response:**
```json
{
  "success": true,
  "testId": "test-123456"
}
```

## 👤 Demo Credentials

### Student Account
- **Email:** `student@demo.com`
- **Password:** `password123`

### Admin Account
- **Email:** `admin@demo.com`
- **Password:** `admin123`

## 🎯 Usage Guide

### Taking a Test

1. **Login** with your credentials
2. **Select a test** from the dashboard
3. **Navigate sections** using the sidebar (or top menu on mobile)
4. **Answer questions** - answers are auto-saved every 30 seconds
5. **Submit** when finished or wait for auto-submit when time runs out

### Admin Manual Grading

1. **Login** as admin
2. Navigate to **Admin Panel**
3. **Select an attempt** from the list
4. **Enter scores** for Writing and Speaking (0-9, in 0.5 increments)
5. **Save scores** - final band will be calculated automatically

## 🚢 Deployment

### Netlify

1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Vercel

1. Connect your repository to Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables in Vercel dashboard

### Other Static Hosting

The `dist` folder contains static files that can be served by any static hosting service.

## 🔒 Security Notes

- **Tokens**: In production, refresh tokens should be stored as httpOnly cookies set by the backend
- **Passwords**: Never store plaintext passwords - all password handling should be on the backend
- **HTTPS**: Always use HTTPS in production for secure API communication
- **CORS**: Configure CORS properly on your backend

## 🧩 Integration with Backend

When integrating with a real backend:

1. Set `VITE_API_BASE_URL` to your backend URL
2. Ensure your backend implements all endpoints as per the API contract
3. Backend should handle:
   - JWT token generation and validation
   - Answer key storage (keep secure, only accessible to authorized roles)
   - File uploads (audio files, test data)
   - Manual grading workflow
   - Result calculation and storage

## 📊 Performance

- **First Contentful Paint:** < 1s (target)
- **Bundle Size:** < 1MB gzipped (target)
- **Code Splitting:** Implemented per route
- **Lazy Loading:** Sections and assets loaded on demand

## ♿ Accessibility

- **WCAG AA** compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Semantic HTML structure
- ARIA labels on interactive elements

## 🐛 Troubleshooting

### MSW not working
- Run `npx msw init public/ --save` to initialize the service worker
- Clear browser cache and reload

### Tests failing
- Ensure all dependencies are installed: `npm install`
- For E2E tests, install Playwright browsers: `npx playwright install`

### Build errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Note:** This is a frontend-only implementation. Backend integration is required for production use. All API endpoints are documented in the API Contract section above.

# ielts-moc

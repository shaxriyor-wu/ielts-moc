# IELTS CD Mock Platform - Full Stack with DeepSeek AI

Professional IELTS Computer-Delivered Mock Test Platform with DeepSeek AI integration for Writing evaluation.

## 🚀 Features

### User Panel
- ✅ Authentication (Signup, Login, JWT)
- ✅ Dashboard with performance charts
- ✅ Listening Module (4 sections, 40 questions, audio player)
- ✅ Reading Module (3 passages, 40 questions, scrollable interface)
- ✅ Writing Module with **DeepSeek AI Evaluation** 🤖
- ✅ Speaking Module (audio recording)
- ✅ Results page with detailed breakdown
- ✅ Profile management

### Admin Panel
- ✅ Dashboard with statistics and charts (Recharts)
- ✅ User Management (search, filter, edit, block, delete)
- ✅ Test Management (create, edit, activate/deactivate, duplicate, export)
- ✅ Results & Analytics
- ✅ Writing AI Evaluation Monitor
- ✅ Speaking Review System
- ✅ CSV Export

### AI Integration
- ✅ DeepSeek AI Writing Evaluation
- ✅ Real-time band score calculation
- ✅ Detailed feedback for each criterion
- ✅ Task 1 and Task 2 evaluation

## 📁 Project Structure

```
IELTS/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts (Auth)
│   ├── utils/              # Utilities (API, scoring)
│   └── mocks/              # Mock data (MSW)
│
├── server/                 # Flask backend
│   ├── routes/             # API routes
│   │   ├── auth.py         # Authentication
│   │   ├── tests.py        # Test management
│   │   ├── results.py      # Results
│   │   ├── admin.py        # Admin endpoints
│   │   └── ai.py           # DeepSeek AI integration
│   ├── static/             # Static files
│   │   └── uploads/        # Uploaded files
│   ├── data/               # JSON database (auto-created)
│   ├── app.py              # Main Flask app
│   └── requirements.txt    # Python dependencies
│
└── README files
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- DeepSeek API key (get from https://platform.deepseek.com)

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your keys:
# DEEPSEEK_API_KEY=sk-your-key-here
# JWT_SECRET_KEY=your-secret-key-change-this

# Run backend
python app.py
```

Backend runs on `http://localhost:5000`

### 2. Frontend Setup

```bash
# From project root
npm install

# Create .env file (optional, for production)
# VITE_API_BASE_URL=http://localhost:5000

# Run frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🔑 Environment Variables

### Backend (`server/.env`)
```
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
JWT_SECRET_KEY=your-secret-key-change-in-production
FLASK_ENV=development
```

### Frontend (`.env` or `vite.config.js`)
```
VITE_API_BASE_URL=http://localhost:5000
VITE_UPLOADS_BASE_URL=http://localhost:5000
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (JWT required)

### Tests
- `GET /api/tests` - Get all tests
- `GET /api/tests/<id>` - Get test by ID
- `POST /api/tests/<id>/submit` - Submit test

### AI Evaluation
- `POST /api/evaluate-writing` - Evaluate writing with DeepSeek AI
  ```json
  {
    "text": "Your essay text...",
    "task": 1
  }
  ```
  Response:
  ```json
  {
    "success": true,
    "scores": {
      "TaskResponse": 7.0,
      "CoherenceCohesion": 6.5,
      "LexicalResource": 7.0,
      "GrammarRangeAccuracy": 6.5,
      "OverallBand": 6.75,
      "Feedback": "Detailed feedback..."
    },
    "evaluationId": "eval-123"
  }
  ```

### Results
- `GET /api/results` - Get user's results
- `GET /api/results/<attempt_id>` - Get specific result

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/export` - Export CSV (admin only)
- `POST /api/admin/speaking/<attempt_id>` - Review speaking (admin only)

## 🤖 DeepSeek AI Integration

1. Get API key from https://platform.deepseek.com
2. Add to `server/.env`:
   ```
   DEEPSEEK_API_KEY=sk-your-key-here
   ```
3. Writing evaluation automatically uses DeepSeek AI when user clicks "Check with DeepSeek AI"

The AI evaluates:
- Task Response / Task Achievement
- Coherence and Cohesion
- Lexical Resource
- Grammar Range and Accuracy
- Overall Band Score
- Detailed Feedback

## 🎨 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios
- React Hot Toast
- Recharts (for admin dashboard)
- React Quill (rich text editor)

### Backend
- Flask
- Flask-JWT-Extended
- Flask-CORS
- Python Requests (for DeepSeek API)
- JSON file storage (easily upgradeable to SQLite/PostgreSQL)

## 📊 Database

Uses JSON files in `server/data/`:
- `users.json` - User accounts
- `tests.json` - Test definitions
- `results.json` - Test results
- `writing_results.json` - AI writing evaluations

**Note:** For production, upgrade to SQLite or PostgreSQL.

## 🚀 Deployment

### Backend (Flask)
- Deploy to Heroku, Railway, or any Python hosting
- Set environment variables
- Ensure `data/` and `static/uploads/` directories are writable

### Frontend (React)
- Build: `npm run build`
- Deploy to Netlify, Vercel, or any static hosting
- Set `VITE_API_BASE_URL` to your backend URL

## 🧪 Testing

```bash
# Frontend tests
npm test

# E2E tests
npm run test:e2e
```

## 📝 Development Notes

- Frontend uses MSW (Mock Service Worker) for development when backend is not available
- Backend automatically creates JSON database files on first run
- DeepSeek API calls are made server-side for security
- JWT tokens stored in localStorage (consider httpOnly cookies for production)

## 🔒 Security Considerations

- Never commit `.env` files
- Use strong JWT secret keys in production
- Implement rate limiting for API endpoints
- Validate all user inputs
- Use HTTPS in production
- Consider implementing refresh tokens

## 📚 Documentation

- `server/README.md` - Backend documentation
- `README_BACKEND.md` - Full stack setup guide
- `API_CONTRACT.md` - API documentation

## 🎯 Next Steps

- [ ] Upgrade to SQLite/PostgreSQL
- [ ] Add refresh token support
- [ ] Implement rate limiting
- [ ] Add email notifications
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Dark mode

## 📄 License

For educational purposes.

## 🤝 Support

For issues or questions, please check the documentation or create an issue.


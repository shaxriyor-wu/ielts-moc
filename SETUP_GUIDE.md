# IELTS CD Mock Platform - Complete Setup Guide

## 🎯 Quick Start (5 minutes)

### Step 1: Backend Setup

```bash
# Navigate to server
cd server

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
echo "DEEPSEEK_API_KEY=your-key-here" > .env
echo "JWT_SECRET_KEY=your-secret-key" >> .env

# Run backend
python app.py
```

Backend will start on `http://localhost:5000`

### Step 2: Frontend Setup

```bash
# From project root
npm install

# Run frontend
npm run dev
```

Frontend will start on `http://localhost:5173`

### Step 3: Get DeepSeek API Key

1. Go to https://platform.deepseek.com
2. Sign up / Login
3. Get your API key
4. Add to `server/.env`:
   ```
   DEEPSEEK_API_KEY=sk-your-key-here
   ```

## 📋 Detailed Setup

### Backend Requirements

- Python 3.9+
- pip

### Frontend Requirements

- Node.js 18+
- npm

### Installation Steps

1. **Clone/Navigate to project**
   ```bash
   cd IELTS
   ```

2. **Backend Setup**
   ```bash
   cd server
   python -m venv venv  # Optional but recommended
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env and add your DeepSeek API key
   python app.py
   ```

3. **Frontend Setup** (in new terminal)
   ```bash
   # From project root
   npm install
   npm run dev
   ```

4. **Access the platform**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/api/health

## 🔑 Environment Variables

### Backend (`server/.env`)
```env
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
JWT_SECRET_KEY=change-this-to-random-string-in-production
FLASK_ENV=development
```

### Frontend (`.env` or set in `vite.config.js`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_UPLOADS_BASE_URL=http://localhost:5000
```

## 🧪 Testing the Setup

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status": "ok", "message": "IELTS CD Mock Platform API"}`

2. **Frontend**
   - Open http://localhost:5173
   - Should see login page
   - Use demo credentials:
     - Student: `student@demo.com` / `password123`
     - Admin: `admin@demo.com` / `admin123`

3. **AI Evaluation Test**
   - Login as student
   - Start a test
   - Go to Writing section
   - Write some text (50+ words)
   - Click "Check with DeepSeek AI"
   - Should see evaluation results

## 🐛 Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Change port in server/app.py
app.run(debug=True, port=5001)
```

**Module not found errors:**
```bash
pip install -r requirements.txt
```

**DeepSeek API errors:**
- Check API key in `.env`
- Verify key is active at https://platform.deepseek.com
- Check API quota/limits

### Frontend Issues

**Cannot connect to backend:**
- Check `VITE_API_BASE_URL` in `.env`
- Ensure backend is running
- Check CORS settings in `server/app.py`

**MSW errors:**
- Run: `npx msw init public/ --save`
- Restart dev server

## 📚 Next Steps

1. Read `README_FULL_STACK.md` for complete documentation
2. Check `server/README.md` for API details
3. Review `API_CONTRACT.md` for endpoint specifications

## 🚀 Production Deployment

### Backend
- Use production WSGI server (Gunicorn)
- Set `FLASK_ENV=production`
- Use strong JWT secret
- Enable HTTPS
- Use real database (PostgreSQL recommended)

### Frontend
- Build: `npm run build`
- Deploy to Netlify/Vercel
- Set production API URL
- Enable HTTPS

## 💡 Tips

- Use virtual environment for Python
- Keep `.env` files out of git
- Test AI evaluation with real DeepSeek key
- Monitor API usage/quota
- Use browser DevTools to debug API calls


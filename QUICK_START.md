# 🚀 Quick Start Guide

Get the IELTS CD Mock Platform running in 5 minutes!

## Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- DeepSeek API key (get from https://platform.deepseek.com)

## Step 1: Backend (2 minutes)

```bash
# Navigate to server
cd server

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "DEEPSEEK_API_KEY=your-key-here" > .env
echo "JWT_SECRET_KEY=your-secret-key" >> .env

# Run backend
python app.py
```

✅ Backend running on http://localhost:5000

## Step 2: Frontend (1 minute)

```bash
# From project root (new terminal)
npm install
npm run dev
```

✅ Frontend running on http://localhost:5173

## Step 3: Test It!

1. Open http://localhost:5173
2. Login with:
   - **Student**: `student@demo.com` / `password123`
   - **Admin**: `admin@demo.com` / `admin123`
3. Start a test → Writing section
4. Write some text (50+ words)
5. Click **"Check with DeepSeek AI"** 🤖
6. See AI evaluation results!

## 🎯 What's Working

✅ User authentication  
✅ Test interface (Listening, Reading, Writing, Speaking)  
✅ **DeepSeek AI Writing Evaluation**  
✅ Admin panel with dashboard  
✅ User management  
✅ Test management  
✅ Results tracking  

## 📖 Next Steps

- Read `SETUP_GUIDE.md` for detailed setup
- Read `README_FULL_STACK.md` for complete documentation
- Configure your DeepSeek API key for real AI evaluation

## 🐛 Troubleshooting

**Backend won't start?**
- Check Python version: `python --version` (need 3.9+)
- Install dependencies: `pip install -r requirements.txt`

**Frontend can't connect?**
- Check backend is running on port 5000
- Set `VITE_API_BASE_URL=http://localhost:5000` in `.env`

**AI evaluation not working?**
- Check DeepSeek API key in `server/.env`
- Verify key is active at https://platform.deepseek.com

## 🎉 You're Ready!

The platform is now running. Start creating tests and evaluating writing with AI!


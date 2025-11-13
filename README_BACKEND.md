# IELTS CD Mock Platform - Full Stack Setup

## Project Structure

```
IELTS/
├── client/              # React frontend (existing)
├── server/              # Flask backend (new)
│   ├── routes/          # API routes
│   ├── static/          # Uploaded files
│   ├── data/            # JSON database files
│   ├── app.py           # Main Flask app
│   └── requirements.txt # Python dependencies
└── README.md            # Main documentation
```

## Quick Start

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Create virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Edit `.env` and add your DeepSeek API key:
```
DEEPSEEK_API_KEY=sk-your-key-here
JWT_SECRET_KEY=your-secret-key-change-this
```

6. Run backend:
```bash
python app.py
```

Backend runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to project root:
```bash
cd ..
```

2. Install dependencies (if not already):
```bash
npm install
```

3. Update frontend API base URL in `.env` or `vite.config.js`:
```
VITE_API_BASE_URL=http://localhost:5000
```

4. Run frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## DeepSeek AI Integration

1. Get API key from https://platform.deepseek.com
2. Add to `server/.env`:
   ```
   DEEPSEEK_API_KEY=sk-your-key-here
   ```
3. Writing evaluation will automatically use DeepSeek AI

## Features

### ✅ Implemented
- User authentication (JWT)
- Test management
- Results tracking
- DeepSeek AI Writing evaluation
- Admin panel APIs
- File uploads (speaking audio)

### 🚧 In Progress
- Complete test submission flow
- Answer key validation
- Speaking audio review interface

## API Documentation

See `server/README.md` for detailed API documentation.

## Development

- Backend: Flask with JWT authentication
- Frontend: React + Vite + Tailwind CSS
- Database: JSON files (easily upgradeable to SQLite/PostgreSQL)
- AI: DeepSeek API for Writing evaluation


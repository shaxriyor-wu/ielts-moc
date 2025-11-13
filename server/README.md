# IELTS CD Mock Platform - Backend Server

Flask backend server for IELTS Computer-Delivered Mock Test Platform with DeepSeek AI integration.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your DeepSeek API key to `.env`:
```
DEEPSEEK_API_KEY=your-api-key-here
JWT_SECRET_KEY=your-secret-key
```

4. Run the server:
```bash
python app.py
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (requires JWT)

### Tests
- `GET /api/tests` - Get all published tests
- `GET /api/tests/<id>` - Get test by ID
- `POST /api/tests/<id>/submit` - Submit test answers

### Results
- `GET /api/results` - Get user's results
- `GET /api/results/<attempt_id>` - Get specific result

### AI Evaluation
- `POST /api/evaluate-writing` - Evaluate writing with DeepSeek AI
- `GET /api/writing-results` - Get writing evaluation history

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/export` - Export results as CSV (admin only)
- `POST /api/admin/speaking/<attempt_id>` - Review speaking (admin only)

## Database

Uses JSON files in `data/` directory:
- `users.json` - User accounts
- `tests.json` - Test definitions
- `results.json` - Test results
- `writing_results.json` - AI writing evaluations

## DeepSeek AI Integration

The platform uses DeepSeek API for automated IELTS Writing evaluation. Make sure to:
1. Get API key from https://platform.deepseek.com
2. Add it to `.env` file
3. The AI will evaluate writing tasks and return band scores


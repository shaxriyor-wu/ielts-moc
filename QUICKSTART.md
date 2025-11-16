# Quick Start Guide - IELTS Mock Test Platform

## Prerequisites

- Python 3.8+ (for Django backend)
- Node.js 16+ (for React frontend)
- PostgreSQL (optional - falls back to SQLite)

## Backend Setup (Django)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example if exists)
# Or create manually with:
# SECRET_KEY=django-insecure-change-this-in-production
# DEBUG=True
# DB_NAME=ielts_moc
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_HOST=localhost
# DB_PORT=5432

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Initialize default users
python manage.py init_users

# Start server
python manage.py runserver
```

Backend runs on `http://localhost:8000`

## Frontend Setup (React)

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

## Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Student:**
- Username: `student`
- Password: `student123`

## Database Options

### Option 1: PostgreSQL (Recommended)

1. Install PostgreSQL
2. Create database: `CREATE DATABASE ielts_moc;`
3. Update `.env` with your PostgreSQL credentials
4. Run migrations

### Option 2: SQLite (Fallback)

If PostgreSQL is not available or `psycopg2` is not installed, Django will automatically use SQLite. No additional configuration needed.

## API Endpoints

All API endpoints are prefixed with `/api/`

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/student/login` - Student login

### Admin
- `GET /api/admin/tests` - List variants
- `POST /api/admin/tests` - Create variant
- `POST /api/admin/tests/upload` - Upload test files

### Student
- `POST /api/student/access` - Access test with code
- `GET /api/student/test` - Get current test
- `POST /api/student/submit` - Submit test

## Project Structure

```
ielts-moc/
├── backend/          # Django backend
│   ├── accounts/     # Authentication
│   ├── exams/        # Test management
│   ├── student_portal/  # Student interface
│   └── grading/      # Grading system
└── client/           # React frontend
```

## Troubleshooting

### Backend Issues

1. **Database connection error**: Check PostgreSQL is running and credentials in `.env`
2. **Migration errors**: Run `python manage.py makemigrations` then `python manage.py migrate`
3. **Module not found**: Ensure virtual environment is activated and dependencies installed

### Frontend Issues

1. **API connection error**: Ensure backend is running on port 8000
2. **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in Django settings
3. **Proxy errors**: Verify `vite.config.js` proxy target is `http://localhost:8000`

## Next Steps

1. Create test variants as admin
2. Upload test files (Reading, Listening, Writing)
3. Add correct answers for Reading and Listening
4. Students can access tests using variant codes
5. Grade tests after submission


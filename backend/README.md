# IELTS Mock Test Platform - Django Backend

Django REST Framework backend for the IELTS Mock Test Platform.

## Technology Stack

- **Framework**: Django 5.0.1
- **API**: Django REST Framework 3.14.0
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL (primary), SQLite (fallback)
- **CORS**: django-cors-headers

## Project Structure

```
backend/
├── ielts_moc/          # Main project settings
├── accounts/           # Authentication and user management
├── exams/              # Test management and variant creation
├── student_portal/     # Student interface and test taking
├── grading/            # Answer checking and AI-powered writing evaluation
├── manage.py
└── requirements.txt
```

## Setup Instructions

### 1. Prerequisites

- Python 3.8 or higher
- PostgreSQL (optional, falls back to SQLite if unavailable)
- pip (Python package manager)

### 2. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Database Setup

#### Option A: PostgreSQL (Recommended)

1. Create a PostgreSQL database:
```sql
CREATE DATABASE ielts_moc;
```

2. Update `.env` with your PostgreSQL credentials:
```
DB_NAME=ielts_moc
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

#### Option B: SQLite (Fallback)

If PostgreSQL is unavailable, Django will automatically use SQLite. No additional configuration needed.

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5.1. Migrating Data from SQLite to PostgreSQL

If you have existing data in SQLite and want to migrate to PostgreSQL:

```bash
# Basic usage (uses DATABASE_URL from environment)
python manage.py migrate_to_postgresql

# With custom SQLite path
python manage.py migrate_to_postgresql --sqlite-path /path/to/db.sqlite3

# With custom PostgreSQL URL
python manage.py migrate_to_postgresql --postgres-url postgresql://user:password@host:port/dbname

# Clear existing PostgreSQL data before importing
python manage.py migrate_to_postgresql --clear-postgres

# Skip migrations (if database schema already exists)
python manage.py migrate_to_postgresql --skip-migrations
```

**Important Notes:**
- The command automatically exports all data from SQLite (accounts, exams, student_portal, grading apps)
- It preserves all relationships and foreign keys
- Use `--clear-postgres` if PostgreSQL already has data (WARNING: This will delete all existing data)
- Make sure PostgreSQL database is created and accessible before running the migration
- The command will run migrations automatically unless `--skip-migrations` is used

### 6. Initialize Default Users

```bash
python manage.py init_users
```

This creates:
- **Admin**: `admin` / `admin123`
- **Student**: `student` / `student123`

### 7. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 8. Run Development Server

```bash
python manage.py runserver
```

Server runs on `http://localhost:8000`

## API Endpoints

### Authentication

- `POST /api/admin/login` - Admin login
- `POST /api/student/login` - Student login
- `POST /api/logout` - Logout
- `GET /api/user` - Get current user

### Admin Endpoints

- `GET /api/admin/tests` - List all variants
- `POST /api/admin/tests` - Create variant
- `GET /api/admin/tests/<id>` - Get variant details
- `PUT /api/admin/tests/<id>` - Update variant
- `DELETE /api/admin/tests/<id>` - Delete variant
- `POST /api/admin/tests/upload` - Upload test file
- `POST /api/admin/tests/answers` - Create/update answers
- `GET /api/admin/stats` - Get admin statistics

### Student Endpoints

- `POST /api/student/access` - Access test with variant code
- `GET /api/student/test` - Get current active test
- `GET /api/student/attempt` - Get current attempt details
- `POST /api/student/answers/reading` - Save reading answers
- `POST /api/student/answers/listening` - Save listening answers
- `POST /api/student/answers/writing` - Save writing content
- `POST /api/student/submit` - Submit test
- `GET /api/student/profile` - Get profile
- `PUT /api/student/profile` - Update profile
- `GET /api/student/stats` - Get statistics
- `GET /api/student/attempts` - Get all attempts
- `GET /api/student/tests` - Get available tests
- `GET /api/student/all-tests` - Get all tests

## Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Student:**
- Username: `student`
- Password: `student123`

## Database Models

### CustomUser
- Extends Django's AbstractUser
- Role field: `admin` or `student`

### Variant
- Test variant with unique 6-digit code
- Duration in minutes
- Created by admin

### TestFile
- Stores Reading, Listening, Writing files
- Linked to variant
- Supports audio files for listening section

### Answer
- Correct answers for Reading and Listening
- Linked to variant and question number

### StudentTest
- Tracks student test attempts
- Status: in_progress, submitted, graded
- Tracks start and submission times

### TestResponse
- Stores student answers for each section
- Supports Reading, Listening, Writing sections

### TestResult
- Stores test scores with detailed breakdown
- Listening, Reading, Writing scores (0-9)
- Overall band score
- JSON fields for detailed breakdowns

## Media Files

Media files (test files, audio files) are stored in `backend/media/` directory.

## Static Files

Static files are collected in `backend/staticfiles/` directory.

## CORS Configuration

CORS is configured to allow requests from `http://localhost:3000` (React frontend).

## Development

### Running Tests

```bash
python manage.py test
```

### Creating Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Accessing Django Admin

1. Create superuser: `python manage.py createsuperuser`
2. Visit: `http://localhost:8000/admin`

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Set a secure `SECRET_KEY`
3. Configure proper database
4. Set up static file serving
5. Configure proper CORS origins
6. Use a production WSGI server (e.g., Gunicorn)


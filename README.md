# IELTS Mock Test Platform

Comprehensive IELTS Mock Test Platform with Django backend and React frontend.

## Technology Stack

- **Backend**: Django 5.0.1 + Django REST Framework
- **Frontend**: React 18 + Vite + TailwindCSS
- **Database**: PostgreSQL (primary), SQLite (fallback)
- **Authentication**: JWT (djangorestframework-simplejwt)

## Project Structure

```
/backend          - Django REST API backend
  ├── accounts/   - Authentication and user management
  ├── exams/      - Test management and variant creation
  ├── student_portal/ - Student interface and test taking
  └── grading/    - Answer checking and AI-powered writing evaluation
/client           - React frontend
```

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

### Backend Setup (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py init_users
python manage.py runserver
```

Backend runs on `http://localhost:8000`

### Frontend Setup (React)

```bash
cd client
npm install
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

## Features

- **Two-role authentication** (Admin, Student)
- **Test Variant Management** - Create variants with unique 6-digit codes
- **File Upload** - Upload Reading, Listening, and Writing test files
- **Answer Management** - Store correct answers for Reading and Listening
- **Student Test Taking** - Access tests using variant codes
- **Auto-save** - Answers are saved automatically
- **Test Submission** - Submit tests with time tracking
- **Grading System** - Automatic grading for Reading/Listening, AI-powered Writing evaluation (ready for integration)
- **Results Tracking** - Detailed score breakdowns and statistics
- **Role-based Access Control** - Secure API endpoints with JWT authentication

## Database Models

- **CustomUser** - Extended user model with role field
- **Variant** - Test variants with unique codes
- **TestFile** - Reading, Listening, Writing files
- **Answer** - Correct answers for Reading and Listening
- **StudentTest** - Student test attempts
- **TestResponse** - Student answers
- **TestResult** - Test scores with detailed breakdowns

## API Documentation

All API endpoints are prefixed with `/api/`

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/student/login` - Student login
- `POST /api/logout` - Logout

### Admin Endpoints
- `GET /api/admin/tests` - List variants
- `POST /api/admin/tests` - Create variant
- `GET /api/admin/tests/<id>` - Get variant details
- `PUT /api/admin/tests/<id>` - Update variant
- `DELETE /api/admin/tests/<id>` - Delete variant
- `POST /api/admin/tests/upload` - Upload test files
- `POST /api/admin/tests/answers` - Create/update answers
- `GET /api/admin/stats` - Get statistics

### Student Endpoints
- `POST /api/student/access` - Access test with variant code
- `GET /api/student/test` - Get current active test
- `GET /api/student/attempt` - Get attempt details
- `POST /api/student/answers/reading` - Save reading answers
- `POST /api/student/answers/listening` - Save listening answers
- `POST /api/student/answers/writing` - Save writing content
- `POST /api/student/submit` - Submit test
- `GET /api/student/profile` - Get profile
- `PUT /api/student/profile` - Update profile
- `GET /api/student/stats` - Get statistics

## Development

See [backend/README.md](backend/README.md) for detailed backend documentation.

## License

MIT


# IELTS Exam Platform - Backend

Node.js/Express backend server.

## Default Owner Credentials

**Login:** `owner`  
**Password:** `owner123`

Configure in `.env` file:
```
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD=owner123
```

Note: You can login with either `owner` (login) or `owner@example.com` (email)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Initialize database:
```bash
npm run init-db
```

4. Start server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Owner
- `POST /api/owner/login`
- `POST /api/owner/admins`
- `GET /api/owner/admins`
- `DELETE /api/owner/admins/:id`
- `GET /api/owner/stats`

### Admin
- `POST /api/admin/login`
- `POST /api/admin/register` (for student registration)
- `POST /api/admin/tests`
- `GET /api/admin/tests`
- `POST /api/admin/test-keys`

### Student
- `POST /api/student/access`
- `GET /api/student/test`
- `POST /api/student/answers/reading`
- `POST /api/student/submit`
- `GET /api/student/profile`
- `GET /api/student/stats`


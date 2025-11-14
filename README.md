# IELTS Exam Platform

Production-ready three-role examination management system.

## Project Structure

```
/server          - Node.js/Express backend
/client          - React frontend
```

## Quick Start

### Server Setup

```bash
cd server
npm install
cp .env.example .env
npm run init-db
npm start
```

Server runs on `http://localhost:5000`

### Client Setup

```bash
cd client
npm install
npm run dev
```

Client runs on `http://localhost:3000`

## Default Credentials

**Owner:**
- Login: `owner`
- Password: `owner123`

Note: You can login with either `owner` (login) or `owner@example.com` (email)

**Admin:**
- Created by Owner

**Student:**
- Register from login page

## Features

- Three-role authentication (Owner, Admin, Student)
- Unified login page for all roles
- Student registration
- Test creation with file upload (JSON, XLSX, CSV)
- Multi-step test creation form
- Real-time exam interface
- Text highlighting
- Auto-save functionality
- Answer sheets
- Statistics and analytics
- Dark/Light mode


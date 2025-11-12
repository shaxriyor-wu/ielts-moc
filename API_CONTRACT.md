# API Contract Documentation

This document provides detailed API contract specifications for integrating a backend with the IELTS CD Mock Platform frontend.

## Base URL

All API endpoints are relative to `VITE_API_BASE_URL` environment variable.

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST `/api/auth/login`
Authenticate a user and receive access tokens.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "token": "string (JWT access token)",
  "refreshToken": "string (refresh token, should be httpOnly cookie in production)",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "student" | "admin"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing required fields

---

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min 6 characters)"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "student"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Email already exists or validation error

---

#### GET `/api/auth/profile`
Get current user's profile.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "student" | "admin"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token

---

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "token": "string (new JWT access token)"
}
```

---

### Tests

#### GET `/api/tests`
Get list of available tests.

**Response (200):**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "duration": "number (minutes)",
    "published": "boolean",
    "sections": {
      "listening": "boolean",
      "reading": "boolean",
      "writing": "boolean",
      "speaking": "boolean"
    }
  }
]
```

---

#### GET `/api/tests/:id`
Get full test details including all questions.

**Response (200):**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "duration": "number",
  "sections": {
    "listening": [
      {
        "section": "number",
        "audio": "string (URL or path)",
        "questions": [
          {
            "id": "string",
            "type": "multiple_choice" | "multiple_select" | "short_answer" | "fill_gap" | "true_false_not_given" | "matching_headings",
            "text": "string",
            "choices": ["string"] (optional),
            "headings": ["string"] (optional, for matching_headings)
          }
        ]
      }
    ],
    "reading": [
      {
        "id": "string",
        "title": "string",
        "text": "string (full passage text)",
        "questions": [
          {
            "id": "string",
            "type": "string",
            "text": "string",
            "choices": ["string"] (optional),
            "headings": ["string"] (optional)
          }
        ]
      }
    ],
    "writing": {
      "task1": "string (prompt)",
      "task2": "string (prompt)"
    },
    "speaking": {
      "description": "string (prompt)"
    }
  }
}
```

---

#### GET `/api/answer-keys/:id`
Get answer key for a test (admin only or for auto-grading).

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "listening": ["string (answers in order)"],
  "reading": ["string (answers in order)"]
}
```

**Error Responses:**
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Answer key not found

---

#### POST `/api/tests/:id/submit`
Submit a completed test.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "string",
  "answers": {
    "listening": ["string | number (answers in order)"],
    "reading": ["string | number (answers in order)"],
    "writing": {
      "task1": "string (HTML or plain text)",
      "task2": "string (HTML or plain text)"
    },
    "speaking": "string (audio file URL or blob reference)"
  }
}
```

**Response (200):**
```json
{
  "attemptId": "string",
  "status": "processing" | "completed"
}
```

**Backend should:**
1. Auto-grade Listening and Reading using answer key
2. Store Writing and Speaking for manual grading
3. Calculate initial band scores
4. Return attemptId for result retrieval

---

#### POST `/api/tests/:id/autosave`
Save draft answers during test (auto-save).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "string",
  "data": {
    "writingDraft": {
      "task1": "string",
      "task2": "string"
    },
    "progress": {
      "currentSection": "listening" | "reading" | "writing" | "speaking",
      "answersCount": {
        "listening": "number",
        "reading": "number"
      }
    }
  }
}
```

**Response (200):**
```json
{
  "saved": true,
  "ts": "number (timestamp)"
}
```

---

### Results

#### GET `/api/results`
Get all results for current user.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "attemptId": "string",
    "userId": "string",
    "testId": "string",
    "submittedAt": "string (ISO 8601)",
    "autoScores": {
      "listening": "number (raw score 0-40)",
      "listeningBand": "number (band 0-9)",
      "reading": "number (raw score 0-40)",
      "readingBand": "number (band 0-9)"
    },
    "manualScores": {
      "writing": "number | null (band 0-9)",
      "speaking": "number | null (band 0-9)"
    },
    "finalBand": "number | null (overall band 0-9)",
    "status": "processing" | "completed"
  }
]
```

---

#### GET `/api/results/:attemptId`
Get detailed result for a specific attempt.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
Same structure as single result object above.

**Error Responses:**
- `404 Not Found`: Result not found
- `403 Forbidden`: User doesn't have access to this result

---

### Admin

#### GET `/api/admin/export`
Export all attempts as CSV (admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="ielts-attempts-YYYY-MM-DD.csv"`

**CSV Format:**
```csv
Attempt ID,User ID,Test ID,Listening,Reading,Writing,Speaking,Final Band,Submitted At
attempt-123,user-1,test-1,35,32,7.5,7.0,7.4,2024-01-01T00:00:00Z
```

---

#### POST `/api/admin/grade/:attemptId`
Manually grade Writing and Speaking sections (admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "writingScore": "number (0-9, in 0.5 increments)",
  "speakingScore": "number (0-9, in 0.5 increments)"
}
```

**Response (200):**
Updated result object with:
- `manualScores` updated
- `finalBand` recalculated
- `status` set to "completed"

**Error Responses:**
- `400 Bad Request`: Invalid scores
- `404 Not Found`: Attempt not found
- `403 Forbidden`: Not authorized

---

#### POST `/api/admin/tests/upload`
Upload a new test (admin only).

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `title`: string (required)
- `description`: string (required)
- `duration`: number (required, minutes)
- `files`: File[] (JSON test file, audio files)

**Response (200):**
```json
{
  "success": true,
  "testId": "string",
  "message": "string"
}
```

---

## Band Score Conversion

The frontend includes a conversion utility, but the backend should verify and use the official IELTS conversion table:

| Raw Score (out of 40) | Band Score |
|----------------------|------------|
| 40 | 9.0 |
| 39 | 8.5 |
| 38 | 8.5 |
| 37-35 | 8.0 |
| 34-32 | 7.5 |
| 31-30 | 7.0 |
| 29-27 | 6.5 |
| 26-24 | 6.0 |
| 23-21 | 5.5 |
| 20-18 | 5.0 |
| 17-15 | 4.5 |
| 14-12 | 4.0 |
| 11-9 | 3.5 |
| 8-6 | 3.0 |
| 5-3 | 2.5 |
| 2-1 | 2.0 |
| 0 | 1.0 |

**Overall Band Calculation:**
Average of all four component scores, rounded to nearest 0.5.

---

## Error Response Format

All errors should follow this format:

```json
{
  "message": "string (human-readable error message)",
  "code": "string (optional error code)",
  "details": "object (optional additional details)"
}
```

---

## Notes for Backend Implementation

1. **Security:**
   - Hash passwords using bcrypt or similar
   - Use httpOnly cookies for refresh tokens
   - Validate JWT tokens on all protected routes
   - Implement rate limiting

2. **File Storage:**
   - Store audio files securely
   - Generate signed URLs for audio access
   - Store speaking recordings (consider cloud storage)

3. **Answer Keys:**
   - Keep answer keys secure (admin-only access)
   - Use for auto-grading only
   - Never expose to frontend in test data

4. **Auto-grading:**
   - Implement case-insensitive matching
   - Handle variations in short answers
   - Log grading results for audit

5. **Manual Grading:**
   - Store grader information
   - Allow multiple graders for quality control
   - Track grading history

6. **Performance:**
   - Cache test data
   - Optimize database queries
   - Use pagination for results list

---

## Testing the API

Use the mock mode (default) to test frontend without a backend. Set `VITE_API_BASE_URL` to your backend URL to switch to real API mode.


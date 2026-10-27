# ClassSathi REST API Documentation (`/api/v1`)

Welcome to the **ClassSathi** backend REST API specification. All API endpoints use standard HTTP verbs, accept and return JSON payloads, and utilize HTTP status codes.

---

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication & Authorization
All protected endpoints require either an **HTTP-only cookie** named `token` or an `Authorization: Bearer <JWT>` header.

Roles:
- `admin`: Full administrative control
- `teacher`: Classroom operations (Attendance, Homework, Exams, Students)
- `parent`: Phase-two read-only portal

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/login`
Authenticate admin or teacher credentials.
- **Request Body**:
  ```json
  {
    "email": "teacher@classsathi.com",
    "password": "Teacher@123456"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "...",
      "name": "Shri Surendra Nath",
      "email": "teacher@classsathi.com",
      "role": "teacher"
    }
  }
  ```

### `POST /auth/logout`
Clears HTTP-only session cookie.
- **Response (200 OK)**: `{ "success": true, "message": "Logged out successfully" }`

### `GET /auth/me`
Fetches current logged-in user profile.
- **Response (200 OK)**: `{ "success": true, "user": { ... } }`

### `POST /auth/change-password`
Allows logged-in users to update their password.
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword456!"
  }
  ```

---

## 2. Dashboard Endpoints (`/dashboard`)

### `GET /dashboard/summary`
Calculates real database-derived metrics for active students, present/absent today, and attendance percentage.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "today": "2026-10-17",
      "schoolName": "Government Model Senior Secondary School",
      "stats": {
        "totalStudents": 25,
        "totalClasses": 2,
        "totalSections": 4,
        "presentToday": 23,
        "absentToday": 1,
        "lateToday": 0,
        "leaveToday": 1,
        "attendanceRateToday": 96,
        "lowAttendanceCount": 0
      },
      "recentActivities": [...]
    }
  }
  ```

### `GET /dashboard/trends?days=7`
Aggregates past 7 or 30 days attendance trends for chart visualization.

### `GET /dashboard/class-comparison`
Provides attendance percentages comparing all active classes today.

---

## 3. Daily Attendance Endpoints (`/attendance`)

### `GET /attendance/roster?classId=:classId&section=:section&schoolDate=YYYY-MM-DD`
Retrieves class roster merged with existing daily records or default unmarked state.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "schoolDate": "2026-10-17",
      "classId": "...",
      "section": "A",
      "session": { "id": "...", "status": "submitted" },
      "summary": { "total": 25, "present": 23, "absent": 1, "late": 0, "leave": 1 },
      "roster": [
        {
          "studentId": "...",
          "fullName": "Aarav Sharma",
          "rollNumber": "1",
          "admissionNumber": "ADM-2026-1001",
          "status": "present",
          "recordId": "..."
        }
      ]
    }
  }
  ```

### `POST /attendance/save`
Saves draft or submits final attendance.
- **Request Body**:
  ```json
  {
    "classId": "...",
    "section": "A",
    "schoolDate": "2026-10-17",
    "isSubmitting": true,
    "records": [
      { "studentId": "...", "status": "present", "remarks": "" },
      { "studentId": "...", "status": "absent", "remarks": "Unexcused" }
    ]
  }
  ```

### `POST /attendance/correct`
Allows authorized correction of submitted records with a mandatory audit reason.
- **Request Body**:
  ```json
  {
    "recordId": "...",
    "newStatus": "late",
    "reason": "Arrived late due to bus breakdown"
  }
  ```

### `GET /attendance/monthly-register?classId=:id&section=:sec&year=2026&month=10`
Returns 1..31 day-by-day attendance grid for Indian school monthly register.

---

## 4. Student Management Endpoints (`/students`)

- `GET /students?classId=...&section=...&search=...&page=1&limit=20`: List students
- `GET /students/:id`: Student profile
- `GET /students/:id/attendance`: Detailed attendance history log & %
- `POST /students`: Create student (Validates unique admission # and roll #)
- `PUT /students/:id`: Update student details
- `PATCH /students/:id/status`: Soft delete / deactivate or restore
- `POST /students/import`: CSV validation dry-run and bulk commit
- `GET /students/export`: Download CSV export

---

## 5. Classes & Sections Endpoints (`/classes`)

- `GET /classes`: List classes with section counts and teachers
- `POST /classes`: Create class (Admin only)
- `PUT /classes/:id`: Update class
- `POST /classes/transfer/:studentId`: Transfer student to new class/section with roll check

---

## 6. Homework Endpoints (`/homework`)

- `GET /homework?classId=...&section=...`: List homework
- `POST /homework`: Assign new homework
- `PUT /homework/:id`: Update homework
- `DELETE /homework/:id`: Remove homework

---

## 7. Exams & Marks Endpoints (`/exams`)

- `GET /exams?classId=...`: List tests and exams
- `POST /exams`: Schedule new exam
- `GET /exams/:id/results`: Marks sheet with student list
- `POST /exams/marks`: Bulk upsert student marks with absent handling

---

## 8. Reports Endpoints (`/reports`)

- `GET /reports/summary`: Class summary report
- `GET /reports/student-wise`: Student-wise attendance register
- `GET /reports/low-attendance`: Low attendance alerts (<75%)
- `GET /reports/export`: Export attendance report as CSV

---

## 9. User Management (`/users`) & Audit Logs (`/audit-logs`)

- `GET /users`: List teacher accounts (Admin only)
- `POST /users`: Create teacher account (Admin only)
- `POST /users/:id/reset-password`: Reset teacher password (Admin only)
- `GET /audit-logs`: Query activity logs
- `GET /settings` & `PUT /settings`: School branding & timezone settings

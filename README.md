# 🎓 ClassSathi — Smart Attendance & Student Management System

> **"Teaching par focus, records ki tension khatam."**  
> *Har Student Ka Record, Teacher Ke Control Mein.*

ClassSathi is a complete, production-ready, fullstack web application designed for school class teachers and administrators. Built with love and engineered specifically for real classroom workflows, it makes daily attendance marking lightning fast, protects student records with tamper-proof audit trails, and provides one-click Indian school monthly registers and analytics.

---

## 🌟 Key Highlights & Modules

1. **⚡ Smart Daily Attendance (Core Feature)**:
   - Designed for teachers on mobile phones, tablets, or desktop during busy morning assemblies.
   - **One-Click "Mark All Present"** and fast status toggles (**Present**, **Absent**, **Late**, **Approved Leave**, **Half Day**).
   - Real-time roster counters (Present, Absent, Late, Leave, Unmarked) with warning guards before submission.
   - Strict database compound unique constraint `{ studentId, schoolDate, classId }` — **zero risk of conflicting or duplicate attendance records**.
   - Mandatory audit reason on corrections to prevent silent rewrites of submitted attendance registers.

2. **📊 Live Database Dashboard**:
   - Live KPI cards: Active Students, Attendance Rate %, Present/Absent Today, Pending Sessions, and Low Attendance Warnings.
   - Interactive **Recharts**: 7-Day Attendance Trend Area Chart, Today's Status Breakdown Donut Chart, and Class-wise Comparison Bar Chart.

3. **📅 Indian School Monthly Attendance Register**:
   - Traditional day-by-day (1..31) grid view matching physical school registers.
   - Color-coded daily statuses (Green `P`, Red `A`, Amber `L`, Blue `LV`, Purple `H`).
   - One-click print layout optimized with dedicated `@media print` CSS for official school records.

4. **👨‍🎓 Complete Student Management**:
   - Comprehensive student directory with search by Name, Roll #, Admission #, and Guardian contact.
   - Filter by Class, Section, and Enrollment Status.
   - CSV Import with **dry-run validation preview** (flags duplicate admissions and occupied roll numbers before saving).
   - CSV Export for official school reports.
   - Detailed Student Profile with attendance percentage metric and historical attendance log.
   - Soft-delete / deactivation protection so academic history is never lost accidentally.

5. **🏫 Class & Section Management**:
   - Multi-grade and section support (Class 10-A, 10-B, Class 9, etc.).
   - Assigned class teachers per section.
   - Student transfer workflow with automated roll number conflict checks.

6. **📚 Homework & Tasks**:
   - Assign homework by subject with submission deadlines and teacher notes.

7. **🏆 Exams & Marks Management**:
   - Schedule unit tests and term assessments with max marks and passing criteria.
   - Full marks entry sheet with distinct handling for **Absent** vs **0 Marks**.

8. **📢 School Notice Board & Class Diary**:
   - Circulars, PTM notices, and event announcements with priority tags (Urgent, High, Normal).

9. **🛡️ Enterprise-Grade Security & Audit Logging**:
   - Secure password hashing with `bcrypt`.
   - `httpOnly` secure cookies and Bearer token fallback.
   - Rate limiting on authentication routes.
   - Role-Based Access Control (`admin`, `teacher`, `parent`).
   - Permanent `AuditLog` recording every login, attendance submission, correction, and student modification.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, TanStack Query, Recharts, React Router v7.
- **Backend**: Node.js, Express, TypeScript, Mongoose, MongoDB, Zod validation, Helmet, Cookie-Parser, Morgan, Bcrypt.
- **Testing**: Vitest, Supertest.
- **Database**: MongoDB (Local or Atlas) with compound indexing and strict uniqueness.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v22)
- MongoDB running locally on port 27017 or a MongoDB Atlas URI

### 2. Installation
Clone the repository and install all dependencies:
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 3. Database Seeding (Demo Data)
ClassSathi comes with a realistic seed script tailored for Indian schools (Classes 10-A, 10-B, 9-A, 25 fictional students, 6 days of historical attendance, homework, exams, and announcements):
```bash
npm run seed
```

### 4. Running Locally
Run both server and client concurrently with a single command:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Login Credentials

The seed script initializes two pre-configured accounts:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Administrator** | `admin@classsathi.com` | `Admin@123456` | Full institution control, users, settings, and logs |
| **Class Teacher** | `teacher@classsathi.com` | `Teacher@123456` | Class 10-A attendance, homework, marks, and students |

*(Both accounts are accessible via the **One-Click Demo Accounts** buttons directly on the login page)*.

---

## 🧪 Testing & Build Verification

Run backend unit and integration tests:
```bash
npm run test
```
All 13 core test suites verify:
- Health check
- Administrator and teacher authentication
- Invalid credentials rejection
- Live database metrics aggregation
- Class listing and student pagination
- Duplicate admission number rejection
- Class roster loading
- Attendance submission and statistics updates
- Mandatory audit reason on attendance correction
- Reports and percentage calculations

Compile production bundles:
```bash
npm run build
```

---

## 🐳 Running with Docker

Deploy everything (App + MongoDB) with Docker Compose:
```bash
docker-compose up -d --build
docker-compose exec app npm run seed
```

---

## 📖 Detailed Documentation

- [REST API Specification (`docs/API.md`)](docs/API.md)
- [Database Schemas & Indexing (`docs/DATABASE.md`)](docs/DATABASE.md)
- [Security Safeguards (`docs/SECURITY.md`)](docs/SECURITY.md)
- [Production Deployment Guide (`docs/DEPLOYMENT.md`)](docs/DEPLOYMENT.md)

---

## 🇮🇳 Made for Teachers

ClassSathi was developed with deep consideration for Indian school teachers to eliminate administrative friction and let them focus on what matters most: **Teaching**.

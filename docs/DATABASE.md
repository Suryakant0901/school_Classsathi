# ClassSathi Database Architecture (`MongoDB + Mongoose`)

This document outlines the entity relationships, indexing strategies, uniqueness rules, and calculation mechanisms implemented in ClassSathi.

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    AcademicYear ||--o{ Class : "spans"
    Class ||--o{ Student : "contains"
    Class ||--o{ AttendanceSession : "tracks"
    AttendanceSession ||--o{ AttendanceRecord : "contains"
    Student ||--o{ AttendanceRecord : "has"
    AttendanceRecord ||--o{ AttendanceAudit : "audited by"
    User ||--o{ AttendanceSession : "marked by"
    User ||--o{ AttendanceAudit : "changed by"
    Class ||--o{ Homework : "assigned to"
    Class ||--o{ Exam : "tested on"
    Exam ||--o{ ExamResult : "graded in"
    Student ||--o{ ExamResult : "receives"
```

---

## 2. Uniqueness & Indexing Strategies

### A. Preventing Conflicting Duplicate Attendance
In school records, a student must **never** receive two conflicting attendance entries on the same day for the same class.

We enforce this at the database engine level with a strict compound unique index on `AttendanceRecord`:
```javascript
attendanceRecordSchema.index(
  { studentId: 1, schoolDate: 1, classId: 1 },
  { unique: true }
);
```

### B. Single Authoritative Daily Session
One class and section can only have one active attendance session per school calendar date:
```javascript
attendanceSessionSchema.index(
  { classId: 1, section: 1, schoolDate: 1 },
  { unique: true }
);
```

### C. Unique Admission Numbers & Roll Numbers
- `admissionNumber`: Universally unique across the school institution.
- `rollNumber`: Unique within `{ classId, section, rollNumber }` for all `active` students via a partial filter index:
```javascript
studentSchema.index(
  { classId: 1, section: 1, rollNumber: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);
```

---

## 3. Date & Timezone Normalization
- School dates are persisted as canonical `YYYY-MM-DD` strings (e.g., `2026-10-17`) rather than unformatted UTC timestamps.
- This prevents dates from shifting backwards or forwards across midnight due to client or server timezone conversions.
- The default operational timezone is configured to `Asia/Kolkata` (Indian Standard Time).

---

## 4. Attendance Percentage Calculation Rules

$$\text{Attendance Rate} = \frac{\text{Present Days} + \text{Late Days} + (0.5 \times \text{Half Days})}{\text{Total Recorded Sessions}} \times 100$$

- **Holidays & Weekends**: Non-working days do not create missing sessions and do not penalize student percentages.
- **Missing Sessions**: Missing dates are not falsely counted as absences. Percentages reflect only officially recorded class sessions.
- **Low Attendance Threshold**: Default is set at `75%` (configurable via School Settings).

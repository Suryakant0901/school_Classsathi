# ClassSathi Security Architecture & Safeguards

This document outlines the security controls, data protections, and operational guidelines implemented in **ClassSathi**.

---

## 1. Authentication & Cookie Protection
- Passwords are securely hashed using `bcrypt` with salt rounds = 10.
- JWT tokens are stored in `httpOnly` cookies with `SameSite=lax` (and `secure: true` in production environments).
- Tokens are also supported via `Authorization: Bearer <token>` for API clients.
- Centralized `auth.ts` middleware verifies user active state on every protected request. If an administrator deactivates an account, the user is immediately denied access.

---

## 2. Role-Based Access Control (RBAC) & IDOR Protection
Three primary tiers are enforced on the backend:
1. **Administrator (`admin`)**:
   - Access to user management, class creation, global school settings, and audit logs.
2. **Teacher (`teacher`)**:
   - Marking daily attendance, entering exam marks, assigning homework, and viewing student profiles.
   - Teachers cannot alter system settings, create administrator accounts, or wipe records.
3. **Parent (`parent`)**:
   - Phase-two read-only portal restricted strictly to linked children's records.

All routes enforce server-side validation (`requireRole`). Frontend buttons are hidden for convenience, but the server unconditionally checks permissions on every API invocation.

---

## 3. Defense Against Automated Attacks
- `helmet`: Sets HTTP security headers to protect against cross-site scripting (XSS), clickjacking, and MIME type sniffing.
- `express-rate-limit`: Sensitive authentication endpoints (`/api/v1/auth/login`) are protected with rate limiting (100 requests per 15 minutes per IP) to prevent brute-force credential stuffing.
- Input validation: All incoming request bodies are parsed and strictly validated using **Zod** schemas before executing any database operation.

---

## 4. Audit Trail for Attendance & Administrative Actions
- All modifications to submitted attendance records require a **mandatory reason** and are logged in `AttendanceAudit` with timestamp, old status, new status, and the user who authorized the change.
- Sensitive administrative events (logins, student creation, status changes, class updates) are recorded in `AuditLog`.
- Audit history is append-only and cannot be altered by standard users.

---

## 5. Accidental Data Loss Prevention (Soft Deletes)
- Students are never permanently deleted with raw `deleteMany()` in normal operations.
- Instead, students are marked with `status: 'inactive'` or `'transferred'`.
- This ensures historical attendance registers, board exam marks, and academic percentages remain permanently intact for school inspection.

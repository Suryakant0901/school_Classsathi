import { Router } from 'express';
import {
  getAttendanceRoster,
  saveAttendanceRoster,
  correctAttendanceRecord,
  getMonthlyAttendanceRegister,
  getAttendanceAuditLogs,
} from '../controllers/attendanceController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Taking & viewing attendance
router.get('/roster', getAttendanceRoster);
router.post('/save', requireRole('admin', 'teacher'), saveAttendanceRoster);
router.post('/correct', requireRole('admin', 'teacher'), correctAttendanceRecord);
router.get('/monthly-register', getMonthlyAttendanceRegister);
router.get('/audit-logs', getAttendanceAuditLogs);

export default router;

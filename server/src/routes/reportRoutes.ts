import { Router } from 'express';
import {
  getAttendanceSummaryReport,
  getStudentWiseReport,
  getLowAttendanceAlertReport,
  exportAttendanceReportCSV,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getAttendanceSummaryReport);
router.get('/student-wise', getStudentWiseReport);
router.get('/low-attendance', getLowAttendanceAlertReport);
router.get('/export', exportAttendanceReportCSV);

export default router;

import { Router } from 'express';
import {
  getDashboardSummary,
  getAttendanceTrends,
  getClassAttendanceComparison,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/trends', getAttendanceTrends);
router.get('/class-comparison', getClassAttendanceComparison);

export default router;

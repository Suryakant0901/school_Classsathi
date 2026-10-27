import { Router } from 'express';
import {
  getExams,
  createExam,
  getExamResults,
  saveExamMarks,
} from '../controllers/examController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getExams);
router.post('/', requireRole('admin', 'teacher'), createExam);
router.get('/:id/results', getExamResults);
router.post('/marks', requireRole('admin', 'teacher'), saveExamMarks);

export default router;

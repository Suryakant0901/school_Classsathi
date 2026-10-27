import { Router } from 'express';
import {
  getHomeworkList,
  createHomework,
  updateHomework,
  deleteHomework,
} from '../controllers/homeworkController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getHomeworkList);
router.post('/', requireRole('admin', 'teacher'), createHomework);
router.put('/:id', requireRole('admin', 'teacher'), updateHomework);
router.delete('/:id', requireRole('admin', 'teacher'), deleteHomework);

export default router;

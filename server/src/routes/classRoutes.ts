import { Router } from 'express';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  getClassStudents,
  transferStudent,
} from '../controllers/classController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getClasses);
router.get('/:id', getClassById);
router.get('/:id/students', getClassStudents);

// Modifying classes requires admin role
router.post('/', requireRole('admin'), createClass);
router.put('/:id', requireRole('admin'), updateClass);
router.post('/transfer/:id', requireRole('admin'), transferStudent);

export default router;

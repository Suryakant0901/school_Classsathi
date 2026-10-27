import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  getStudentAttendanceHistory,
  importStudentsCSV,
  exportStudentsCSV,
} from '../controllers/studentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getStudents);
router.get('/export', exportStudentsCSV);
router.get('/:id', getStudentById);
router.get('/:id/attendance', getStudentAttendanceHistory);

// Mutating student records
router.post('/', requireRole('admin', 'teacher'), createStudent);
router.put('/:id', requireRole('admin', 'teacher'), updateStudent);
router.patch('/:id/status', requireRole('admin'), toggleStudentStatus);
router.post('/import', requireRole('admin', 'teacher'), importStudentsCSV);

export default router;

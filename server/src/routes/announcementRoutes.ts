import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post('/', requireRole('admin', 'teacher'), createAnnouncement);
router.delete('/:id', requireRole('admin'), deleteAnnouncement);

export default router;

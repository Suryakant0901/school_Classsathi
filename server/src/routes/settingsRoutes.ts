import { Router } from 'express';
import {
  getSchoolSettings,
  updateSchoolSettings,
} from '../controllers/settingsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getSchoolSettings);
router.put('/', requireRole('admin'), updateSchoolSettings);

export default router;

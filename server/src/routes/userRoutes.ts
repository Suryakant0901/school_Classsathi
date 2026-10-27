import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
} from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;

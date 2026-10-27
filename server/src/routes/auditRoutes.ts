import { Router } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { action, entityType, limit = '50' } = req.query;
    const filter: any = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, parseInt(String(limit), 10)))
      .lean();

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

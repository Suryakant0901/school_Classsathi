import { Router } from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import classRoutes from './classRoutes.js';
import studentRoutes from './studentRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import homeworkRoutes from './homeworkRoutes.js';
import examRoutes from './examRoutes.js';
import announcementRoutes from './announcementRoutes.js';
import reportRoutes from './reportRoutes.js';
import userRoutes from './userRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/homework', homeworkRoutes);
router.use('/exams', examRoutes);
router.use('/announcements', announcementRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);

export default router;

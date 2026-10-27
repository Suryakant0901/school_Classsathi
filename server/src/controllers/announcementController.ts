import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Announcement } from '../models/Announcement.js';
import { logActivity } from '../utils/auditLogger.js';
import { createAnnouncementSchema } from '../validators/schemas.js';

export const getAnnouncements = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { audience, classId } = req.query;
    const filter: any = { status: 'active' };

    if (audience && audience !== 'all') {
      filter.audience = { $in: ['all', audience] };
    }

    if (classId) {
      filter.$or = [{ classId: null }, { classId }];
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name role')
      .populate('classId', 'name')
      .sort({ publishedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createAnnouncementSchema.parse(req.body);
    const user = req.user!;

    const announcement = await Announcement.create({
      ...validated,
      createdBy: user._id,
      publishedAt: new Date(),
    });

    await logActivity({
      req,
      action: 'ANNOUNCEMENT_CREATE',
      entityType: 'Announcement',
      entityId: announcement._id.toString(),
      details: { title: announcement.title, priority: announcement.priority },
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { status: 'archived' },
      { new: true }
    );

    if (!announcement) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Announcement archived successfully',
    });
  } catch (error) {
    next(error);
  }
};

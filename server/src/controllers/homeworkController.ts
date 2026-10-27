import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Homework } from '../models/Homework.js';
import { logActivity } from '../utils/auditLogger.js';
import { createHomeworkSchema } from '../validators/schemas.js';

export const getHomeworkList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section, subject, status } = req.query;
    const filter: any = {};

    if (classId) filter.classId = classId;
    if (section) filter.section = String(section).toUpperCase();
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const list = await Homework.find(filter)
      .populate('classId', 'name grade')
      .populate('createdBy', 'name')
      .sort({ dueDate: -1 })
      .lean();

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

export const createHomework = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createHomeworkSchema.parse(req.body);
    const user = req.user!;

    const homework = await Homework.create({
      ...validated,
      section: validated.section.toUpperCase(),
      createdBy: user._id,
    });

    await logActivity({
      req,
      action: 'HOMEWORK_CREATE',
      entityType: 'Homework',
      entityId: homework._id.toString(),
      details: { title: homework.title, subject: homework.subject, dueDate: homework.dueDate },
    });

    res.status(201).json({
      success: true,
      message: 'Homework assigned successfully',
      data: homework,
    });
  } catch (error) {
    next(error);
  }
};

export const updateHomework = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!homework) {
      res.status(404).json({ success: false, message: 'Homework not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Homework updated successfully',
      data: homework,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHomework = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByIdAndDelete(id);

    if (!homework) {
      res.status(404).json({ success: false, message: 'Homework not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Homework removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

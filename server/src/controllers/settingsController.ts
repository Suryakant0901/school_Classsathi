import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { SchoolSetting } from '../models/SchoolSetting.js';
import { logActivity } from '../utils/auditLogger.js';
import { updateSchoolSettingsSchema } from '../validators/schemas.js';

export const getSchoolSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let setting = await SchoolSetting.findOne();
    if (!setting) {
      setting = await SchoolSetting.create({});
    }

    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchoolSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = updateSchoolSettingsSchema.parse(req.body);
    let setting = await SchoolSetting.findOne();

    if (!setting) {
      setting = await SchoolSetting.create(validated);
    } else {
      Object.assign(setting, validated);
      await setting.save();
    }

    await logActivity({
      req,
      action: 'SETTINGS_UPDATE',
      entityType: 'SchoolSetting',
      entityId: setting._id.toString(),
      details: validated,
    });

    res.json({
      success: true,
      message: 'School settings updated successfully',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
};

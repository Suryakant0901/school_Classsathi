import { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { IUser } from '../models/User.js';

interface LogOptions {
  req?: Request;
  actor?: IUser;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
}

export const logActivity = async (options: LogOptions): Promise<void> => {
  try {
    const { req, actor, action, entityType, entityId, details } = options;

    const user = actor || (req as any)?.user;
    const ipAddress = req?.ip || req?.socket.remoteAddress;
    const userAgent = req?.get('user-agent');

    await AuditLog.create({
      actorId: user?._id,
      actorName: user?.name || 'System / Guest',
      actorRole: user?.role || 'anonymous',
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

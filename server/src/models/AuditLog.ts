import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      default: 'System',
    },
    actorRole: {
      type: String,
      required: true,
      default: 'system',
    },
    action: {
      type: String,
      required: true,
      index: true, // e.g. "AUTH_LOGIN", "ATTENDANCE_SUBMIT", "STUDENT_CREATE"
    },
    entityType: {
      type: String,
      required: true,
      index: true, // e.g. "AttendanceSession", "Student", "User"
    },
    entityId: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

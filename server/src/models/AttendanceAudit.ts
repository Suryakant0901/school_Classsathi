import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendanceAudit extends Document {
  attendanceRecordId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  schoolDate: string;
  previousStatus: string;
  newStatus: string;
  changedBy: mongoose.Types.ObjectId;
  reason: string;
  createdAt: Date;
}

const attendanceAuditSchema = new Schema<IAttendanceAudit>(
  {
    attendanceRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceRecord',
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    schoolDate: {
      type: String,
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Correction reason is mandatory'],
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AttendanceAudit: Model<IAttendanceAudit> = mongoose.model<IAttendanceAudit>(
  'AttendanceAudit',
  attendanceAuditSchema
);

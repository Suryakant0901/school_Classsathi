import mongoose, { Document, Schema, Model } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'half_day';

export interface IAttendanceRecord extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  section: string;
  schoolDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  markedBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
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
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    schoolDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'leave', 'half_day'],
      required: true,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Strict uniqueness constraint: a student can have only ONE attendance record per class and schoolDate!
attendanceRecordSchema.index({ studentId: 1, schoolDate: 1, classId: 1 }, { unique: true });
// Fast query index for reports by class, section, date range, and status
attendanceRecordSchema.index({ classId: 1, section: 1, schoolDate: 1, status: 1 });

export const AttendanceRecord: Model<IAttendanceRecord> = mongoose.model<IAttendanceRecord>(
  'AttendanceRecord',
  attendanceRecordSchema
);

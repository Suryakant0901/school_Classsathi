import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  halfDay: number;
  markedCount: number;
}

export interface IAttendanceSession extends Document {
  classId: mongoose.Types.ObjectId;
  section: string;
  schoolDate: string; // YYYY-MM-DD format
  status: 'draft' | 'submitted' | 'corrected' | 'locked';
  markedBy: mongoose.Types.ObjectId;
  submittedAt?: Date;
  lockedAt?: Date;
  summary: IAttendanceSummary;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    schoolDate: {
      type: String, // YYYY-MM-DD
      required: [true, 'School date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'corrected', 'locked'],
      default: 'draft',
      index: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    lockedAt: {
      type: Date,
    },
    summary: {
      total: { type: Number, default: 0 },
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      leave: { type: Number, default: 0 },
      halfDay: { type: Number, default: 0 },
      markedCount: { type: Number, default: 0 },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// One session per class, section, and school date
attendanceSessionSchema.index({ classId: 1, section: 1, schoolDate: 1 }, { unique: true });

export const AttendanceSession: Model<IAttendanceSession> = mongoose.model<IAttendanceSession>(
  'AttendanceSession',
  attendanceSessionSchema
);

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAcademicYear extends Document {
  name: string; // e.g. "2026-2027"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const academicYearSchema = new Schema<IAcademicYear>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const AcademicYear: Model<IAcademicYear> = mongoose.model<IAcademicYear>(
  'AcademicYear',
  academicYearSchema
);

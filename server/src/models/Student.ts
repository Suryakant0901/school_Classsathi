import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IStudent extends Document {
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  photo?: string;
  classId: mongoose.Types.ObjectId;
  section: string;
  academicYearId?: mongoose.Types.ObjectId;
  dob?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  admissionDate?: Date;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'transferred';
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    fullName: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      index: true,
    },
    photo: {
      type: String,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      index: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    guardianName: {
      type: String,
      required: [true, 'Guardian name is required'],
      trim: true,
    },
    guardianPhone: {
      type: String,
      required: [true, 'Guardian phone number is required'],
      trim: true,
    },
    guardianEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'transferred'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure roll number uniqueness within a class & section for active students
studentSchema.index(
  { classId: 1, section: 1, rollNumber: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

export const Student: Model<IStudent> = mongoose.model<IStudent>('Student', studentSchema);

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IExam extends Document {
  title: string;
  examDate: string; // YYYY-MM-DD
  classId: mongoose.Types.ObjectId;
  section: string;
  subject: string;
  maxMarks: number;
  passingMarks: number;
  status: 'scheduled' | 'completed' | 'graded';
  academicYearId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
    },
    examDate: {
      type: String,
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
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: [1, 'Maximum marks must be at least 1'],
    },
    passingMarks: {
      type: Number,
      required: true,
      min: [0, 'Passing marks cannot be negative'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'graded'],
      default: 'scheduled',
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

examSchema.index({ classId: 1, section: 1, examDate: 1 });

export const Exam: Model<IExam> = mongoose.model<IExam>('Exam', examSchema);

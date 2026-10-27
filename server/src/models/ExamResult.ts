import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IExamResult extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  marksObtained: number;
  isAbsent: boolean;
  remarks?: string;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const examResultSchema = new Schema<IExamResult>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
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
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One result record per student per exam
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const ExamResult: Model<IExamResult> = mongoose.model<IExamResult>(
  'ExamResult',
  examResultSchema
);

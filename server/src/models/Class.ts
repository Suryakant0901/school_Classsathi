import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IClassSectionTeacher {
  section: string;
  teacherId?: mongoose.Types.ObjectId;
}

export interface IClass extends Document {
  name: string; // e.g. "Class 10"
  grade: string; // e.g. "10"
  sections: string[]; // e.g. ["A", "B"]
  academicYearId?: mongoose.Types.ObjectId;
  sectionTeachers: IClassSectionTeacher[];
  description?: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade/Standard is required'],
      trim: true,
    },
    sections: {
      type: [String],
      default: ['A'],
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
    },
    sectionTeachers: [
      {
        section: { type: String, required: true },
        teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure class name uniqueness per academic year
classSchema.index({ name: 1, academicYearId: 1 }, { unique: true });

export const Class: Model<IClass> = mongoose.model<IClass>('Class', classSchema);

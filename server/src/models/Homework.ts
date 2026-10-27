import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IHomework extends Document {
  title: string;
  description: string;
  classId: mongoose.Types.ObjectId;
  section: string;
  subject: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  createdBy: mongoose.Types.ObjectId;
  status: 'assigned' | 'completed' | 'archived';
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const homeworkSchema = new Schema<IHomework>(
  {
    title: {
      type: String,
      required: [true, 'Homework title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
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
    assignedDate: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'completed', 'archived'],
      default: 'assigned',
    },
    attachmentUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

homeworkSchema.index({ classId: 1, section: 1, dueDate: 1 });

export const Homework: Model<IHomework> = mongoose.model<IHomework>('Homework', homeworkSchema);

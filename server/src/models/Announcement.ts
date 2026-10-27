import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  audience: 'all' | 'teachers' | 'parents' | 'class';
  classId?: mongoose.Types.ObjectId;
  section?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdBy: mongoose.Types.ObjectId;
  publishedAt: Date;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    audience: {
      type: String,
      enum: ['all', 'teachers', 'parents', 'class'],
      default: 'all',
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    section: {
      type: String,
      uppercase: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
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

export const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>(
  'Announcement',
  announcementSchema
);

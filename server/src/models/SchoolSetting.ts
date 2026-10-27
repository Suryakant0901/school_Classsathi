import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISchoolSetting extends Document {
  schoolName: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  principalName?: string;
  timezone: string;
  defaultAttendanceThreshold: number;
  workingDays: number[]; // 0: Sun, 1: Mon, ..., 6: Sat
  currentAcademicYearId?: mongoose.Types.ObjectId;
  attendanceStatuses: {
    code: string;
    label: string;
    color: string;
    isEnabled: boolean;
  }[];
  integrations: {
    email: { isEnabled: boolean; provider: string; fromAddress?: string };
    sms: { isEnabled: boolean; provider: string; senderId?: string };
    whatsapp: { isEnabled: boolean; provider: string };
  };
  createdAt: Date;
  updatedAt: Date;
}

const schoolSettingSchema = new Schema<ISchoolSetting>(
  {
    schoolName: {
      type: String,
      default: 'Government Model Senior Secondary School',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Teaching par focus, records ki tension khatam.',
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    address: {
      type: String,
      default: 'Civil Lines, Model Town, New Delhi, India',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'contact@classsathi-school.edu.in',
    },
    principalName: {
      type: String,
      default: 'Dr. Ramesh Kumar Sharma',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    defaultAttendanceThreshold: {
      type: Number,
      default: 75,
    },
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6], // Mon-Sat
    },
    currentAcademicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
    },
    attendanceStatuses: {
      type: [
        {
          code: String,
          label: String,
          color: String,
          isEnabled: Boolean,
        },
      ],
      default: [
        { code: 'present', label: 'Present', color: '#16A34A', isEnabled: true },
        { code: 'absent', label: 'Absent', color: '#DC2626', isEnabled: true },
        { code: 'late', label: 'Late', color: '#D97706', isEnabled: true },
        { code: 'leave', label: 'Approved Leave', color: '#2563EB', isEnabled: true },
        { code: 'half_day', label: 'Half Day', color: '#9333EA', isEnabled: true },
      ],
    },
    integrations: {
      email: {
        isEnabled: { type: Boolean, default: false },
        provider: { type: String, default: 'smtp' },
        fromAddress: { type: String, default: 'notifications@classsathi.edu' },
      },
      sms: {
        isEnabled: { type: Boolean, default: false },
        provider: { type: String, default: 'twilio' },
        senderId: { type: String, default: 'CLSATH' },
      },
      whatsapp: {
        isEnabled: { type: Boolean, default: false },
        provider: { type: String, default: 'gupshup' },
      },
    },
  },
  { timestamps: true }
);

export const SchoolSetting: Model<ISchoolSetting> = mongoose.model<ISchoolSetting>(
  'SchoolSetting',
  schoolSettingSchema
);

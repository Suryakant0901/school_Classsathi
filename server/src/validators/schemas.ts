import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

// Class Schemas
export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  grade: z.string().min(1, 'Grade is required'),
  sections: z.array(z.string()).min(1, 'At least one section is required'),
  academicYearId: z.string().optional(),
  sectionTeachers: z
    .array(
      z.object({
        section: z.string(),
        teacherId: z.string().optional(),
      })
    )
    .optional(),
  description: z.string().optional(),
});

export const updateClassSchema = createClassSchema.partial();

// Student Schemas
export const createStudentSchema = z.object({
  fullName: z.string().min(1, 'Student full name is required').max(100),
  admissionNumber: z.string().min(1, 'Admission number is required').trim(),
  rollNumber: z.string().min(1, 'Roll number is required').trim(),
  photo: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  academicYearId: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).default('Male'),
  admissionDate: z.string().optional(),
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianPhone: z.string().min(10, 'Valid 10-digit guardian phone number required'),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'transferred']).default('active'),
});

export const updateStudentSchema = createStudentSchema.partial();

export const transferStudentSchema = z.object({
  targetClassId: z.string().min(1, 'Target class ID is required'),
  targetSection: z.string().min(1, 'Target section is required'),
  newRollNumber: z.string().min(1, 'New roll number is required'),
});

// Attendance Schemas
export const attendanceRecordItemSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  status: z.enum(['present', 'absent', 'late', 'leave', 'half_day']),
  remarks: z.string().optional(),
});

export const saveAttendanceRosterSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  section: z.string().min(1, 'Section is required'),
  schoolDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  records: z.array(attendanceRecordItemSchema),
  notes: z.string().optional(),
  isSubmitting: z.boolean().default(false), // true if submitting, false if draft
});

export const correctAttendanceSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  newStatus: z.enum(['present', 'absent', 'late', 'leave', 'half_day']),
  reason: z.string().min(3, 'A clear reason for attendance correction is required'),
});

// Homework Schemas
export const createHomeworkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  classId: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  subject: z.string().min(1, 'Subject is required'),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attachmentUrl: z.string().optional(),
});

// Exam Schemas
export const createExamSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  classId: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  subject: z.string().min(1, 'Subject is required'),
  maxMarks: z.number().min(1, 'Max marks must be at least 1'),
  passingMarks: z.number().min(0, 'Passing marks cannot be negative'),
});

export const saveExamMarksSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  results: z.array(
    z.object({
      studentId: z.string(),
      marksObtained: z.number().min(0),
      isAbsent: z.boolean().default(false),
      remarks: z.string().optional(),
    })
  ),
});

// Announcement Schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  audience: z.enum(['all', 'teachers', 'parents', 'class']).default('all'),
  classId: z.string().optional(),
  section: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

// Settings Schema
export const updateSchoolSettingsSchema = z.object({
  schoolName: z.string().min(1).optional(),
  tagline: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  principalName: z.string().optional(),
  timezone: z.string().optional(),
  defaultAttendanceThreshold: z.number().min(1).max(100).optional(),
  workingDays: z.array(z.number()).optional(),
});

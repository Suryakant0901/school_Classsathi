export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  assignedClasses?: string[];
}

export interface AcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'active' | 'archived';
}

export interface ClassSectionTeacher {
  section: string;
  teacherId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface ClassItem {
  _id: string;
  name: string;
  grade: string;
  sections: string[];
  academicYearId?: {
    _id: string;
    name: string;
  };
  sectionTeachers?: ClassSectionTeacher[];
  description?: string;
  status: 'active' | 'archived';
  studentCount?: number;
  sectionCounts?: Record<string, number>;
}

export interface Student {
  _id: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  photo?: string;
  classId: {
    _id: string;
    name: string;
    grade: string;
  };
  section: string;
  dob?: string;
  gender: 'Male' | 'Female' | 'Other';
  admissionDate?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address?: string;
  status: 'active' | 'inactive' | 'transferred';
  createdAt?: string;
}

export type AttendanceStatusType = 'present' | 'absent' | 'late' | 'leave' | 'half_day';

export interface AttendanceRosterItem {
  studentId: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  photo?: string;
  gender?: string;
  recordId: string | null;
  status: AttendanceStatusType | null;
  remarks?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  halfDay: number;
  markedCount: number;
  unmarkedCount?: number;
}

export interface AttendanceSession {
  id: string;
  status: 'draft' | 'submitted' | 'corrected' | 'locked';
  markedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  submittedAt?: string;
  summary: AttendanceSummary;
  notes?: string;
}

export interface Homework {
  _id: string;
  title: string;
  description: string;
  classId: {
    _id: string;
    name: string;
    grade: string;
  };
  section: string;
  subject: string;
  assignedDate: string;
  dueDate: string;
  createdBy: {
    _id: string;
    name: string;
  };
  status: 'assigned' | 'completed' | 'archived';
}

export interface Exam {
  _id: string;
  title: string;
  examDate: string;
  classId: {
    _id: string;
    name: string;
    grade: string;
  };
  section: string;
  subject: string;
  maxMarks: number;
  passingMarks: number;
  status: 'scheduled' | 'completed' | 'graded';
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'teachers' | 'parents' | 'class';
  classId?: {
    _id: string;
    name: string;
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdBy: {
    _id: string;
    name: string;
  };
  publishedAt: string;
}

export interface SchoolNotification {
  _id: string;
  type: 'attendance' | 'homework' | 'exam' | 'system' | 'security';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface SchoolSetting {
  schoolName: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  principalName?: string;
  timezone: string;
  defaultAttendanceThreshold: number;
  workingDays: number[];
}

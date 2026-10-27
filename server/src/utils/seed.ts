import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord, AttendanceStatus } from '../models/AttendanceRecord.js';
import { Homework } from '../models/Homework.js';
import { Exam } from '../models/Exam.js';
import { ExamResult } from '../models/ExamResult.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { SchoolSetting } from '../models/SchoolSetting.js';

export const seedDatabase = async (
  options: { purge?: boolean; closeConnection?: boolean } = {}
) => {
  const { purge = true, closeConnection = false } = options;
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('🌱 Starting ClassSathi database seeding...');

    // Clean existing records
    if (purge) {
      await Promise.all([
        User.deleteMany({}),
        AcademicYear.deleteMany({}),
        Class.deleteMany({}),
        Student.deleteMany({}),
        AttendanceSession.deleteMany({}),
        AttendanceRecord.deleteMany({}),
        Homework.deleteMany({}),
        Exam.deleteMany({}),
        ExamResult.deleteMany({}),
        Announcement.deleteMany({}),
        Notification.deleteMany({}),
        SchoolSetting.deleteMany({}),
      ]);
      console.log('🧹 Purged existing collections.');
    }

    // 1. Create Academic Year
    const academicYear = await AcademicYear.create({
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
      status: 'active',
    });

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
    const teacherPasswordHash = await bcrypt.hash('Teacher@123456', salt);

    const adminUser = await User.create({
      name: 'Shri Suryakant (Admin)',
      email: 'admin@classsathi.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+91 98765 00001',
      isActive: true,
    });

    const teacherUser = await User.create({
      name: 'Shri Surendra Nath (Class Teacher)',
      email: 'teacher@classsathi.com',
      passwordHash: teacherPasswordHash,
      role: 'teacher',
      phone: '+91 98765 00002',
      isActive: true,
    });

    const assistantTeacher = await User.create({
      name: 'Smt. Anita Sharma',
      email: 'anita.sharma@classsathi.com',
      passwordHash: teacherPasswordHash,
      role: 'teacher',
      phone: '+91 98765 00003',
      isActive: true,
    });

    // 3. Create Classes
    const class10 = await Class.create({
      name: 'Class 10',
      grade: '10',
      sections: ['A', 'B'],
      academicYearId: academicYear._id,
      sectionTeachers: [
        { section: 'A', teacherId: teacherUser._id },
        { section: 'B', teacherId: assistantTeacher._id },
      ],
      description: 'Secondary School Board Batch 2026-27',
      status: 'active',
    });

    const class9 = await Class.create({
      name: 'Class 9',
      grade: '9',
      sections: ['A', 'B'],
      academicYearId: academicYear._id,
      sectionTeachers: [{ section: 'A', teacherId: assistantTeacher._id }],
      description: 'Ninth Grade General Studies',
      status: 'active',
    });

    // Update teacher assigned classes
    teacherUser.assignedClasses = [class10._id as any];
    await teacherUser.save();

    assistantTeacher.assignedClasses = [class10._id as any, class9._id as any];
    await assistantTeacher.save();

    // 4. Create Students for Class 10-A
    const studentNames = [
      { name: 'Aarav Sharma', gender: 'Male', guardian: 'Rakesh Sharma', phone: '9871100001' },
      { name: 'Aditi Verma', gender: 'Female', guardian: 'Sunil Verma', phone: '9871100002' },
      { name: 'Ananya Gupta', gender: 'Female', guardian: 'Mahesh Gupta', phone: '9871100003' },
      { name: 'Ayush Kumar', gender: 'Male', guardian: 'Pramod Kumar', phone: '9871100004' },
      { name: 'Bhavna Joshi', gender: 'Female', guardian: 'Harish Joshi', phone: '9871100005' },
      { name: 'Chirag Tiwari', gender: 'Male', guardian: 'Vinod Tiwari', phone: '9871100006' },
      { name: 'Devendra Yadav', gender: 'Male', guardian: 'Ramphal Yadav', phone: '9871100007' },
      { name: 'Divya Chauhan', gender: 'Female', guardian: 'Sanjay Chauhan', phone: '9871100008' },
      { name: 'Gaurav Pandey', gender: 'Male', guardian: 'Satish Pandey', phone: '9871100009' },
      { name: 'Ishita Rawat', gender: 'Female', guardian: 'Trilok Rawat', phone: '9871100010' },
      { name: 'Kunal Saxena', gender: 'Male', guardian: 'Alok Saxena', phone: '9871100011' },
      { name: 'Manish Singh', gender: 'Male', guardian: 'Bhagwan Singh', phone: '9871100012' },
      { name: 'Megha Nair', gender: 'Female', guardian: 'Gopal Nair', phone: '9871100013' },
      { name: 'Nikhil Mishra', gender: 'Male', guardian: 'Pawan Mishra', phone: '9871100014' },
      { name: 'Pooja Bhatt', gender: 'Female', guardian: 'Kewal Bhatt', phone: '9871100015' },
      { name: 'Pranav Malhotra', gender: 'Male', guardian: 'Deepak Malhotra', phone: '9871100016' },
      { name: 'Priya Dubey', gender: 'Female', guardian: 'Arun Dubey', phone: '9871100017' },
      { name: 'Rahul Chaurasia', gender: 'Male', guardian: 'Kamlesh Chaurasia', phone: '9871100018' },
      { name: 'Riya Sen', gender: 'Female', guardian: 'Subhash Sen', phone: '9871100019' },
      { name: 'Rohan Mehra', gender: 'Male', guardian: 'Vikas Mehra', phone: '9871100020' },
      { name: 'Sanskriti Jain', gender: 'Female', guardian: 'Naveen Jain', phone: '9871100021' },
      { name: 'Shivam Tripathi', gender: 'Male', guardian: 'Brajesh Tripathi', phone: '9871100022' },
      { name: 'Shreya Das', gender: 'Female', guardian: 'Pradip Das', phone: '9871100023' },
      { name: 'Tanmay Kulkarni', gender: 'Male', guardian: 'Shridhar Kulkarni', phone: '9871100024' },
      { name: 'Varun Aggarwal', gender: 'Male', guardian: 'Anil Aggarwal', phone: '9871100025' },
    ];

    const students = await Promise.all(
      studentNames.map((s, idx) => {
        const rollStr = String(idx + 1);
        const admStr = `ADM-2026-${1001 + idx}`;
        return Student.create({
          fullName: s.name,
          admissionNumber: admStr,
          rollNumber: rollStr,
          classId: class10._id,
          section: 'A',
          academicYearId: academicYear._id,
          gender: s.gender as any,
          guardianName: s.guardian,
          guardianPhone: s.phone,
          guardianEmail: `${s.name.toLowerCase().replace(' ', '.')}@family.example.com`,
          address: 'Block B, Sector 14, City Center',
          status: 'active',
        });
      })
    );
    console.log(`👨‍🎓 Created ${students.length} students in Class 10-A.`);

    // 5. Seed Attendance for the past 6 school days + Today (2026-10-17)
    const dates = [
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
    ];

    for (const d of dates) {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let leaveCount = 0;

      // Seed session first
      const session = await AttendanceSession.create({
        classId: class10._id,
        section: 'A',
        schoolDate: d,
        status: 'submitted',
        markedBy: teacherUser._id,
        submittedAt: new Date(`${d}T09:30:00Z`),
        summary: {
          total: students.length,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          halfDay: 0,
          markedCount: students.length,
        },
      });

      const recordsToInsert = students.map((stu, i) => {
        let status: AttendanceStatus = 'present';
        // Fictional pattern: Roll 4 & 18 absent occasionally, Roll 7 late
        if ((i === 3 || i === 17) && (d === '2026-10-14' || d === '2026-10-16')) {
          status = 'absent';
        } else if (i === 6 && d === '2026-10-15') {
          status = 'late';
        } else if (i === 11 && d === '2026-10-17') {
          status = 'leave';
        }

        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
        else if (status === 'leave') leaveCount++;

        return {
          sessionId: session._id,
          studentId: stu._id,
          classId: class10._id,
          section: 'A',
          schoolDate: d,
          status,
          remarks: status === 'leave' ? 'Fever - application sent by father' : '',
          markedBy: teacherUser._id,
        };
      });

      await AttendanceRecord.insertMany(recordsToInsert);

      session.summary.present = presentCount;
      session.summary.absent = absentCount;
      session.summary.late = lateCount;
      session.summary.leave = leaveCount;
      await session.save();
    }
    console.log('📅 Seeded past 6 days of attendance records.');

    // 6. Seed Homework
    await Homework.create([
      {
        title: 'Exercise 4.2 - Quadratic Equations',
        description: 'Solve questions 1 through 10 from NCERT Chapter 4 in homework register.',
        classId: class10._id,
        section: 'A',
        subject: 'Mathematics',
        assignedDate: '2026-10-15',
        dueDate: '2026-10-19',
        createdBy: teacherUser._id,
        status: 'assigned',
      },
      {
        title: 'Chemical Reactions and Equations - Notes',
        description: 'Complete balance chemical equations practical sheet given in lab.',
        classId: class10._id,
        section: 'A',
        subject: 'Science',
        assignedDate: '2026-10-14',
        dueDate: '2026-10-18',
        createdBy: assistantTeacher._id,
        status: 'assigned',
      },
    ]);

    // 7. Seed Exam and Sample Results
    const exam = await Exam.create({
      title: 'Unit Test 1 - Mathematics',
      examDate: '2026-10-10',
      classId: class10._id,
      section: 'A',
      subject: 'Mathematics',
      maxMarks: 50,
      passingMarks: 18,
      status: 'graded',
      academicYearId: academicYear._id,
      createdBy: teacherUser._id,
    });

    const marksData = students.map((stu, i) => {
      const isAbsent = i === 17; // Roll 18 was absent
      const marks = isAbsent ? 0 : 25 + ((i * 7) % 25);
      return {
        examId: exam._id,
        studentId: stu._id,
        classId: class10._id,
        marksObtained: marks,
        isAbsent,
        remarks: isAbsent ? 'Medical Leave' : marks > 40 ? 'Excellent' : 'Good',
        updatedBy: teacherUser._id,
      };
    });
    await ExamResult.insertMany(marksData);
    console.log('📝 Seeded Unit Test 1 exam with marks.');

    // 8. Seed Announcements
    await Announcement.create([
      {
        title: 'Parent-Teacher Meeting (PTM) Scheduled',
        message:
          'Quarterly Parent-Teacher Meeting will be held this Saturday between 9:00 AM and 1:00 PM. All class teachers are requested to keep registers updated.',
        audience: 'all',
        priority: 'high',
        createdBy: adminUser._id,
      },
      {
        title: 'Inter-School Science Exhibition Entries',
        message: 'Students of Class 10 who wish to submit working models should contact Smt. Anita Sharma by Wednesday.',
        audience: 'class',
        classId: class10._id,
        section: 'A',
        priority: 'normal',
        createdBy: teacherUser._id,
      },
    ]);

    // 9. Seed School Setting
    await SchoolSetting.create({
      schoolName: 'Government Model Senior Secondary School',
      tagline: 'Teaching par focus, records ki tension khatam.',
      address: 'Civil Lines, Model Town, New Delhi - 110009',
      phone: '+91 98765 43210',
      email: 'principal@gmsss-delhi.edu.in',
      principalName: 'Dr. Ramesh Kumar Sharma',
      timezone: 'Asia/Kolkata',
      defaultAttendanceThreshold: 75,
      currentAcademicYearId: academicYear._id,
    });

    // 10. Seed Notifications
    await Notification.create([
      {
        userId: teacherUser._id,
        type: 'attendance',
        title: 'Attendance Saved Successfully',
        message: 'Attendance for Class 10-A on 2026-10-17 has been submitted.',
        isRead: false,
      },
      {
        userId: adminUser._id,
        type: 'system',
        title: 'System Setup Complete',
        message: 'ClassSathi initialized for academic year 2026-2027.',
        isRead: true,
      },
    ]);

    console.log(`
🎉 Database Seeding Completed Successfully!
------------------------------------------------------
Admin Account:   admin@classsathi.com   / Admin@123456
Teacher Account: teacher@classsathi.com / Teacher@123456
------------------------------------------------------
    `);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    if (closeConnection) {
      await disconnectDB();
    }
  }
};

export const runSeed = async () => {
  await seedDatabase({ purge: true, closeConnection: true });
};

if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  runSeed();
}

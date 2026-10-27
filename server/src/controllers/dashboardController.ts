import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Student } from '../models/Student.js';
import { Class } from '../models/Class.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AuditLog } from '../models/AuditLog.js';
import { SchoolSetting } from '../models/SchoolSetting.js';
import { env } from '../config/env.js';

// Helper to get formatted local date (YYYY-MM-DD)
export const getSchoolTodayDate = (timezone: string = env.SCHOOL_TIMEZONE): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA returns YYYY-MM-DD
};

export const getDashboardSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const setting = await SchoolSetting.findOne();
    const timezone = setting?.timezone || env.SCHOOL_TIMEZONE;
    const today = getSchoolTodayDate(timezone);
    const threshold = setting?.defaultAttendanceThreshold || env.LOW_ATTENDANCE_THRESHOLD;

    // 1. Total Active Students
    const totalStudents = await Student.countDocuments({ status: 'active' });

    // 2. Total Active Classes
    const activeClasses = await Class.find({ status: 'active' });
    const totalClasses = activeClasses.length;
    let totalSections = 0;
    activeClasses.forEach((c) => {
      totalSections += c.sections.length;
    });

    // 3. Today's Attendance Sessions
    const todaySessions = await AttendanceSession.find({ schoolDate: today });
    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;
    let leaveToday = 0;
    let halfDayToday = 0;
    let markedStudentsToday = 0;

    todaySessions.forEach((s) => {
      presentToday += s.summary.present || 0;
      absentToday += s.summary.absent || 0;
      lateToday += s.summary.late || 0;
      leaveToday += s.summary.leave || 0;
      halfDayToday += s.summary.halfDay || 0;
      markedStudentsToday += s.summary.markedCount || 0;
    });

    const attendanceRateToday =
      markedStudentsToday > 0
        ? Math.round(((presentToday + lateToday + halfDayToday * 0.5) / markedStudentsToday) * 100)
        : 0;

    // 4. Pending Sessions
    const submittedSessionsCount = todaySessions.filter((s) => s.status === 'submitted' || s.status === 'corrected').length;
    const pendingSessionsCount = Math.max(0, totalSections - submittedSessionsCount);

    // 5. Low Attendance Students Count
    // Aggregate overall attendance percentage per student
    const studentStats = await AttendanceRecord.aggregate([
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          percentage: {
            $cond: [
              { $gt: ['$totalDays', 0] },
              { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $match: {
          percentage: { $lt: threshold },
        },
      },
    ]);

    const lowAttendanceCount = studentStats.length;

    // 6. Recent Activities
    const recentActivities = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.json({
      success: true,
      data: {
        today,
        schoolName: setting?.schoolName || 'ClassSathi Public School',
        tagline: setting?.tagline || 'Teaching par focus, records ki tension khatam.',
        stats: {
          totalStudents,
          totalClasses,
          totalSections,
          presentToday,
          absentToday,
          lateToday,
          leaveToday,
          halfDayToday,
          markedStudentsToday,
          attendanceRateToday,
          submittedSessionsCount,
          pendingSessionsCount,
          lowAttendanceCount,
        },
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceTrends = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = Number(req.query.days) || 7;
    const setting = await SchoolSetting.findOne();
    const timezone = setting?.timezone || env.SCHOOL_TIMEZONE;

    // Aggregate past N distinct dates from AttendanceSession
    const trendSessions = await AttendanceSession.aggregate([
      {
        $group: {
          _id: '$schoolDate',
          totalPresent: { $sum: '$summary.present' },
          totalAbsent: { $sum: '$summary.absent' },
          totalLate: { $sum: '$summary.late' },
          totalLeave: { $sum: '$summary.leave' },
          totalMarked: { $sum: '$summary.markedCount' },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: days },
      { $sort: { _id: 1 } },
    ]);

    const trends = trendSessions.map((t) => {
      const percentage =
        t.totalMarked > 0
          ? Math.round(((t.totalPresent + t.totalLate) / t.totalMarked) * 100)
          : 0;

      return {
        date: t._id,
        present: t.totalPresent,
        absent: t.totalAbsent,
        late: t.totalLate,
        leave: t.totalLeave,
        percentage,
      };
    });

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
};

export const getClassAttendanceComparison = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const setting = await SchoolSetting.findOne();
    const timezone = setting?.timezone || env.SCHOOL_TIMEZONE;
    const today = getSchoolTodayDate(timezone);

    const classes = await Class.find({ status: 'active' }).populate('sectionTeachers.teacherId', 'name');

    const classStats = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({
          classId: cls._id,
          status: 'active',
        });

        const todaySessions = await AttendanceSession.find({
          classId: cls._id,
          schoolDate: today,
        });

        let present = 0;
        let absent = 0;
        let late = 0;
        let marked = 0;

        todaySessions.forEach((s) => {
          present += s.summary.present || 0;
          absent += s.summary.absent || 0;
          late += s.summary.late || 0;
          marked += s.summary.markedCount || 0;
        });

        const percentage = marked > 0 ? Math.round(((present + late) / marked) * 100) : 0;

        return {
          classId: cls._id,
          className: cls.name,
          sections: cls.sections,
          totalStudents: studentCount,
          present,
          absent,
          late,
          percentage,
          isMarked: todaySessions.length > 0,
        };
      })
    );

    res.json({
      success: true,
      data: classStats,
    });
  } catch (error) {
    next(error);
  }
};

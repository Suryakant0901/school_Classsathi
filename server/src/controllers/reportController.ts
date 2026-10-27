import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { Student } from '../models/Student.js';
import { Class } from '../models/Class.js';
import { SchoolSetting } from '../models/SchoolSetting.js';
import { env } from '../config/env.js';

export const getAttendanceSummaryReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, classId, section } = req.query;

    const sessionFilter: any = {};
    if (startDate && endDate) {
      sessionFilter.schoolDate = { $gte: String(startDate), $lte: String(endDate) };
    }
    if (classId) sessionFilter.classId = classId;
    if (section) sessionFilter.section = String(section).toUpperCase();

    const sessions = await AttendanceSession.find(sessionFilter)
      .populate('classId', 'name grade')
      .populate('markedBy', 'name')
      .sort({ schoolDate: -1 })
      .lean();

    let totalSessions = sessions.length;
    let aggregatePresent = 0;
    let aggregateAbsent = 0;
    let aggregateLate = 0;
    let aggregateLeave = 0;
    let aggregateHalfDay = 0;
    let aggregateMarked = 0;

    sessions.forEach((s) => {
      aggregatePresent += s.summary.present || 0;
      aggregateAbsent += s.summary.absent || 0;
      aggregateLate += s.summary.late || 0;
      aggregateLeave += s.summary.leave || 0;
      aggregateHalfDay += s.summary.halfDay || 0;
      aggregateMarked += s.summary.markedCount || 0;
    });

    const averagePercentage =
      aggregateMarked > 0
        ? Math.round(
            ((aggregatePresent + aggregateLate + aggregateHalfDay * 0.5) / aggregateMarked) * 100
          )
        : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalSessions,
          aggregatePresent,
          aggregateAbsent,
          aggregateLate,
          aggregateLeave,
          aggregateHalfDay,
          aggregateMarked,
          averagePercentage,
        },
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentWiseReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section, startDate, endDate, search } = req.query;

    const studentFilter: any = { status: 'active' };
    if (classId) studentFilter.classId = classId;
    if (section) studentFilter.section = String(section).toUpperCase();
    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      studentFilter.$or = [{ fullName: regex }, { rollNumber: regex }, { admissionNumber: regex }];
    }

    const students = await Student.find(studentFilter)
      .populate('classId', 'name grade')
      .sort({ rollNumber: 1, fullName: 1 })
      .lean();

    const recordFilter: any = {};
    if (startDate && endDate) {
      recordFilter.schoolDate = { $gte: String(startDate), $lte: String(endDate) };
    }
    if (classId) recordFilter.classId = classId;
    if (section) recordFilter.section = String(section).toUpperCase();

    const records = await AttendanceRecord.find(recordFilter).lean();

    // Map: studentId -> records
    const studentRecordsMap: Record<string, any[]> = {};
    records.forEach((r) => {
      const sId = r.studentId.toString();
      if (!studentRecordsMap[sId]) studentRecordsMap[sId] = [];
      studentRecordsMap[sId].push(r);
    });

    const reportData = students.map((stu) => {
      const studentRecs = studentRecordsMap[stu._id.toString()] || [];
      const totalSessions = studentRecs.length;

      let present = 0;
      let absent = 0;
      let late = 0;
      let leave = 0;
      let halfDay = 0;

      studentRecs.forEach((r) => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
        else if (r.status === 'leave') leave++;
        else if (r.status === 'half_day') halfDay++;
      });

      const percentage =
        totalSessions > 0
          ? Math.round(((present + late + halfDay * 0.5) / totalSessions) * 100)
          : 0;

      return {
        studentId: stu._id,
        fullName: stu.fullName,
        admissionNumber: stu.admissionNumber,
        rollNumber: stu.rollNumber,
        class: (stu.classId as any)?.name || '',
        section: stu.section,
        guardianName: stu.guardianName,
        guardianPhone: stu.guardianPhone,
        totalSessions,
        present,
        absent,
        late,
        leave,
        halfDay,
        percentage,
      };
    });

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

export const getLowAttendanceAlertReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section } = req.query;
    const setting = await SchoolSetting.findOne();
    const threshold = setting?.defaultAttendanceThreshold || env.LOW_ATTENDANCE_THRESHOLD;

    const studentFilter: any = { status: 'active' };
    if (classId) studentFilter.classId = classId;
    if (section) studentFilter.section = String(section).toUpperCase();

    const students = await Student.find(studentFilter)
      .populate('classId', 'name grade')
      .sort({ rollNumber: 1 })
      .lean();

    const records = await AttendanceRecord.find(
      classId ? { classId } : {}
    ).lean();

    const studentRecordsMap: Record<string, any[]> = {};
    records.forEach((r) => {
      const sId = r.studentId.toString();
      if (!studentRecordsMap[sId]) studentRecordsMap[sId] = [];
      studentRecordsMap[sId].push(r);
    });

    const lowAttendanceStudents = students
      .map((stu) => {
        const studentRecs = studentRecordsMap[stu._id.toString()] || [];
        const totalSessions = studentRecs.length;

        let present = 0;
        let absent = 0;
        let late = 0;
        let leave = 0;
        let halfDay = 0;

        studentRecs.forEach((r) => {
          if (r.status === 'present') present++;
          else if (r.status === 'absent') absent++;
          else if (r.status === 'late') late++;
          else if (r.status === 'leave') leave++;
          else if (r.status === 'half_day') halfDay++;
        });

        const percentage =
          totalSessions > 0
            ? Math.round(((present + late + halfDay * 0.5) / totalSessions) * 100)
            : 0;

        return {
          studentId: stu._id,
          fullName: stu.fullName,
          admissionNumber: stu.admissionNumber,
          rollNumber: stu.rollNumber,
          class: (stu.classId as any)?.name || '',
          section: stu.section,
          guardianName: stu.guardianName,
          guardianPhone: stu.guardianPhone,
          totalSessions,
          present,
          absent,
          late,
          leave,
          halfDay,
          percentage,
          threshold,
        };
      })
      .filter((s) => s.totalSessions > 0 && s.percentage < threshold)
      .sort((a, b) => a.percentage - b.percentage);

    res.json({
      success: true,
      threshold,
      data: lowAttendanceStudents,
    });
  } catch (error) {
    next(error);
  }
};

export const exportAttendanceReportCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section, startDate, endDate } = req.query;

    const studentFilter: any = { status: 'active' };
    if (classId) studentFilter.classId = classId;
    if (section) studentFilter.section = String(section).toUpperCase();

    const students = await Student.find(studentFilter)
      .populate('classId', 'name')
      .sort({ rollNumber: 1 })
      .lean();

    const recordFilter: any = {};
    if (startDate && endDate) {
      recordFilter.schoolDate = { $gte: String(startDate), $lte: String(endDate) };
    }
    if (classId) recordFilter.classId = classId;
    if (section) recordFilter.section = String(section).toUpperCase();

    const records = await AttendanceRecord.find(recordFilter).lean();

    const studentRecordsMap: Record<string, any[]> = {};
    records.forEach((r) => {
      const sId = r.studentId.toString();
      if (!studentRecordsMap[sId]) studentRecordsMap[sId] = [];
      studentRecordsMap[sId].push(r);
    });

    const headers = [
      'Roll Number',
      'Admission Number',
      'Student Name',
      'Class',
      'Section',
      'Total Working Days',
      'Present Days',
      'Absent Days',
      'Late Days',
      'Leave Days',
      'Attendance %',
      'Guardian Name',
      'Guardian Phone',
    ];

    const csvRows = [headers.join(',')];

    students.forEach((stu: any) => {
      const studentRecs = studentRecordsMap[stu._id.toString()] || [];
      const totalSessions = studentRecs.length;

      let present = 0;
      let absent = 0;
      let late = 0;
      let leave = 0;
      let halfDay = 0;

      studentRecs.forEach((r) => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
        else if (r.status === 'leave') leave++;
        else if (r.status === 'half_day') halfDay++;
      });

      const percentage =
        totalSessions > 0
          ? Math.round(((present + late + halfDay * 0.5) / totalSessions) * 100)
          : 0;

      const row = [
        `"${stu.rollNumber}"`,
        `"${stu.admissionNumber}"`,
        `"${stu.fullName}"`,
        `"${stu.classId?.name || ''}"`,
        `"${stu.section}"`,
        `"${totalSessions}"`,
        `"${present}"`,
        `"${absent}"`,
        `"${late}"`,
        `"${leave}"`,
        `"${percentage}%"`,
        `"${stu.guardianName}"`,
        `"${stu.guardianPhone}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance-report-${startDate || 'all'}-to-${endDate || 'now'}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

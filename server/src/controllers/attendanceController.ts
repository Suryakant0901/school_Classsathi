import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord, AttendanceStatus } from '../models/AttendanceRecord.js';
import { AttendanceAudit } from '../models/AttendanceAudit.js';
import { Student } from '../models/Student.js';
import { Class } from '../models/Class.js';
import { SchoolSetting } from '../models/SchoolSetting.js';
import { logActivity } from '../utils/auditLogger.js';
import {
  saveAttendanceRosterSchema,
  correctAttendanceSchema,
} from '../validators/schemas.js';
import { getSchoolTodayDate } from './dashboardController.js';

export const getAttendanceRoster = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section, schoolDate } = req.query;

    if (!classId || !section) {
      res.status(400).json({ success: false, message: 'Class and section are required' });
      return;
    }

    const setting = await SchoolSetting.findOne();
    const dateToUse = (schoolDate as string) || getSchoolTodayDate(setting?.timezone);

    // 1. Fetch active students in class & section sorted by rollNumber
    const students = await Student.find({
      classId,
      section: String(section).toUpperCase(),
      status: 'active',
    })
      .sort({ rollNumber: 1, fullName: 1 })
      .lean();

    // 2. Fetch existing session if any
    const session = await AttendanceSession.findOne({
      classId,
      section: String(section).toUpperCase(),
      schoolDate: dateToUse,
    }).populate('markedBy', 'name role');

    // 3. Fetch existing attendance records for this session
    const existingRecords = await AttendanceRecord.find({
      classId,
      section: String(section).toUpperCase(),
      schoolDate: dateToUse,
    }).lean();

    const recordMap = new Map<string, any>();
    existingRecords.forEach((rec) => {
      recordMap.set(rec.studentId.toString(), rec);
    });

    // 4. Construct roster merging student list with existing records
    const roster = students.map((stu) => {
      const rec = recordMap.get(stu._id.toString());
      return {
        studentId: stu._id,
        fullName: stu.fullName,
        admissionNumber: stu.admissionNumber,
        rollNumber: stu.rollNumber,
        photo: stu.photo,
        gender: stu.gender,
        recordId: rec ? rec._id : null,
        status: rec ? rec.status : null, // null means unmarked
        remarks: rec ? rec.remarks || '' : '',
      };
    });

    // Compute status counts
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let halfDay = 0;
    let markedCount = 0;

    roster.forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
      else if (r.status === 'leave') leave++;
      else if (r.status === 'half_day') halfDay++;
      if (r.status) markedCount++;
    });

    res.json({
      success: true,
      data: {
        schoolDate: dateToUse,
        classId,
        section: String(section).toUpperCase(),
        session: session
          ? {
              id: session._id,
              status: session.status,
              markedBy: session.markedBy,
              submittedAt: session.submittedAt,
              summary: session.summary,
              notes: session.notes,
            }
          : null,
        summary: {
          total: students.length,
          present,
          absent,
          late,
          leave,
          halfDay,
          markedCount,
          unmarkedCount: students.length - markedCount,
        },
        roster,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const saveAttendanceRoster = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = saveAttendanceRosterSchema.parse(req.body);
    const { classId, section, schoolDate, records, notes, isSubmitting } = validated;
    const user = req.user!;

    // 1. Verify class exists
    const cls = await Class.findById(classId);
    if (!cls) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    // 2. Compute summary aggregates
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let halfDay = 0;

    records.forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
      else if (r.status === 'leave') leave++;
      else if (r.status === 'half_day') halfDay++;
    });

    const total = await Student.countDocuments({
      classId,
      section: section.toUpperCase(),
      status: 'active',
    });

    const summary = {
      total,
      present,
      absent,
      late,
      leave,
      halfDay,
      markedCount: records.length,
    };

    // 3. Upsert AttendanceSession
    const sessionStatus = isSubmitting ? 'submitted' : 'draft';

    const session = await AttendanceSession.findOneAndUpdate(
      { classId, section: section.toUpperCase(), schoolDate },
      {
        classId,
        section: section.toUpperCase(),
        schoolDate,
        status: sessionStatus,
        markedBy: user._id,
        summary,
        notes: notes || '',
        ...(isSubmitting ? { submittedAt: new Date() } : {}),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 4. Upsert AttendanceRecords for each student
    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: {
          studentId: rec.studentId,
          schoolDate,
          classId,
        },
        update: {
          $set: {
            sessionId: session._id,
            section: section.toUpperCase(),
            status: rec.status,
            remarks: rec.remarks || '',
            markedBy: user._id,
            updatedBy: user._id,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await AttendanceRecord.bulkWrite(bulkOps);
    }

    await logActivity({
      req,
      action: isSubmitting ? 'ATTENDANCE_SUBMIT' : 'ATTENDANCE_DRAFT_SAVE',
      entityType: 'AttendanceSession',
      entityId: session._id.toString(),
      details: {
        classId,
        section,
        schoolDate,
        summary,
        status: sessionStatus,
      },
    });

    res.json({
      success: true,
      message: isSubmitting
        ? 'Attendance submitted successfully!'
        : 'Attendance draft saved successfully.',
      data: {
        session,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const correctAttendanceRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = correctAttendanceSchema.parse(req.body);
    const { recordId, newStatus, reason } = validated;
    const user = req.user!;

    const record = await AttendanceRecord.findById(recordId);
    if (!record) {
      res.status(404).json({ success: false, message: 'Attendance record not found' });
      return;
    }

    const previousStatus = record.status;
    if (previousStatus === newStatus) {
      res.status(400).json({
        success: false,
        message: 'New status is identical to current status.',
      });
      return;
    }

    // Update the record
    record.status = newStatus as AttendanceStatus;
    record.updatedBy = user._id;
    await record.save();

    // Log to AttendanceAudit trail
    await AttendanceAudit.create({
      attendanceRecordId: record._id,
      sessionId: record.sessionId,
      studentId: record.studentId,
      schoolDate: record.schoolDate,
      previousStatus,
      newStatus,
      changedBy: user._id,
      reason,
    });

    // Update AttendanceSession status to 'corrected' and recalculate summary
    const allRecords = await AttendanceRecord.find({
      sessionId: record.sessionId,
    });

    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let halfDay = 0;

    allRecords.forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
      else if (r.status === 'leave') leave++;
      else if (r.status === 'half_day') halfDay++;
    });

    const session = await AttendanceSession.findById(record.sessionId);
    if (session) {
      session.status = 'corrected';
      session.summary.present = present;
      session.summary.absent = absent;
      session.summary.late = late;
      session.summary.leave = leave;
      session.summary.halfDay = halfDay;
      session.summary.markedCount = allRecords.length;
      await session.save();
    }

    await logActivity({
      req,
      action: 'ATTENDANCE_CORRECTION',
      entityType: 'AttendanceRecord',
      entityId: record._id.toString(),
      details: {
        studentId: record.studentId,
        schoolDate: record.schoolDate,
        previousStatus,
        newStatus,
        reason,
      },
    });

    res.json({
      success: true,
      message: 'Attendance corrected and audit log recorded.',
      data: {
        record,
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyAttendanceRegister = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section, year, month } = req.query;

    if (!classId || !section || !year || !month) {
      res.status(400).json({
        success: false,
        message: 'classId, section, year, and month are required',
      });
      return;
    }

    const y = parseInt(String(year), 10);
    const m = parseInt(String(month), 10); // 1-indexed (1 to 12)
    const formattedMonth = m < 10 ? `0${m}` : `${m}`;
    const startDate = `${y}-${formattedMonth}-01`;
    const daysInMonth = new Date(y, m, 0).getDate();
    const endDate = `${y}-${formattedMonth}-${daysInMonth < 10 ? `0${daysInMonth}` : daysInMonth}`;

    // Active students
    const students = await Student.find({
      classId,
      section: String(section).toUpperCase(),
      status: 'active',
    })
      .sort({ rollNumber: 1, fullName: 1 })
      .lean();

    // All attendance records in date range
    const records = await AttendanceRecord.find({
      classId,
      section: String(section).toUpperCase(),
      schoolDate: { $gte: startDate, $lte: endDate },
    }).lean();

    // Map: studentId -> date -> status
    const studentRecordsMap: Record<string, Record<string, string>> = {};
    records.forEach((r) => {
      const sId = r.studentId.toString();
      if (!studentRecordsMap[sId]) studentRecordsMap[sId] = {};
      studentRecordsMap[sId][r.schoolDate] = r.status;
    });

    // Build day columns
    const dayColumns: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      dayColumns.push(`${y}-${formattedMonth}-${dayStr}`);
    }

    // Build student attendance grid
    const registerGrid = students.map((stu) => {
      const sId = stu._id.toString();
      const attendanceByDay: Record<string, string | null> = {};
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let leaveCount = 0;
      let halfDayCount = 0;
      let markedDays = 0;

      dayColumns.forEach((date) => {
        const st = studentRecordsMap[sId]?.[date] || null;
        attendanceByDay[date] = st;
        if (st === 'present') presentCount++;
        else if (st === 'absent') absentCount++;
        else if (st === 'late') lateCount++;
        else if (st === 'leave') leaveCount++;
        else if (st === 'half_day') halfDayCount++;
        if (st) markedDays++;
      });

      const percentage =
        markedDays > 0
          ? Math.round(((presentCount + lateCount + halfDayCount * 0.5) / markedDays) * 100)
          : 0;

      return {
        studentId: stu._id,
        fullName: stu.fullName,
        admissionNumber: stu.admissionNumber,
        rollNumber: stu.rollNumber,
        attendanceByDay,
        stats: {
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
          halfDayCount,
          markedDays,
          percentage,
        },
      };
    });

    res.json({
      success: true,
      data: {
        year: y,
        month: m,
        daysInMonth,
        dayColumns,
        students: registerGrid,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId, schoolDate } = req.query;
    const filter: any = {};
    if (studentId) filter.studentId = studentId;
    if (schoolDate) filter.schoolDate = schoolDate;

    const audits = await AttendanceAudit.find(filter)
      .populate('studentId', 'fullName rollNumber admissionNumber')
      .populate('changedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: audits,
    });
  } catch (error) {
    next(error);
  }
};

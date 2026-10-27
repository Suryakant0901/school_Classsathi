import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Student } from '../models/Student.js';
import { Class } from '../models/Class.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { logActivity } from '../utils/auditLogger.js';
import { createStudentSchema, updateStudentSchema } from '../validators/schemas.js';

export const getStudents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      classId,
      section,
      status = 'active',
      page = '1',
      limit = '20',
      sortBy = 'rollNumber',
      sortOrder = 'asc',
    } = req.query;

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (classId) {
      query.classId = classId;
    }

    if (section) {
      query.section = String(section).toUpperCase();
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { rollNumber: searchRegex },
        { admissionNumber: searchRegex },
        { guardianName: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption: any = {};
    const order = sortOrder === 'desc' ? -1 : 1;

    if (sortBy === 'rollNumber') {
      // Sort numerically by rollNumber where possible
      sortOption.rollNumber = order;
    } else {
      sortOption[String(sortBy)] = order;
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('classId', 'name grade')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Student.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate('classId', 'name grade sections');

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createStudentSchema.parse(req.body);

    // 1. Check admission number uniqueness
    const existingAdmission = await Student.findOne({
      admissionNumber: validated.admissionNumber.toUpperCase(),
    });
    if (existingAdmission) {
      res.status(400).json({
        success: false,
        message: `Student with Admission Number ${validated.admissionNumber} already exists (${existingAdmission.fullName}).`,
      });
      return;
    }

    // 2. Check roll number uniqueness in class & section
    const existingRoll = await Student.findOne({
      classId: validated.classId,
      section: validated.section.toUpperCase(),
      rollNumber: validated.rollNumber,
      status: 'active',
    });
    if (existingRoll) {
      res.status(400).json({
        success: false,
        message: `Roll number ${validated.rollNumber} is already assigned to ${existingRoll.fullName} in this section.`,
      });
      return;
    }

    const student = await Student.create({
      ...validated,
      admissionNumber: validated.admissionNumber.toUpperCase(),
      section: validated.section.toUpperCase(),
    });

    await logActivity({
      req,
      action: 'STUDENT_CREATE',
      entityType: 'Student',
      entityId: student._id.toString(),
      details: {
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        classId: student.classId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = updateStudentSchema.parse(req.body);

    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // If admission number changed, check uniqueness
    if (validated.admissionNumber && validated.admissionNumber.toUpperCase() !== student.admissionNumber) {
      const dup = await Student.findOne({
        admissionNumber: validated.admissionNumber.toUpperCase(),
        _id: { $ne: id },
      });
      if (dup) {
        res.status(400).json({
          success: false,
          message: `Admission Number ${validated.admissionNumber} is already used by ${dup.fullName}.`,
        });
        return;
      }
      student.admissionNumber = validated.admissionNumber.toUpperCase();
    }

    // If class, section or roll number changed, check roll uniqueness
    const targetClass = validated.classId || student.classId;
    const targetSection = (validated.section || student.section).toUpperCase();
    const targetRoll = validated.rollNumber || student.rollNumber;

    if (
      String(targetClass) !== String(student.classId) ||
      targetSection !== student.section ||
      targetRoll !== student.rollNumber
    ) {
      const dupRoll = await Student.findOne({
        classId: targetClass,
        section: targetSection,
        rollNumber: targetRoll,
        status: 'active',
        _id: { $ne: id },
      });
      if (dupRoll) {
        res.status(400).json({
          success: false,
          message: `Roll Number ${targetRoll} is already taken in this section by ${dupRoll.fullName}.`,
        });
        return;
      }
    }

    Object.assign(student, validated);
    if (validated.admissionNumber) student.admissionNumber = validated.admissionNumber.toUpperCase();
    if (validated.section) student.section = validated.section.toUpperCase();

    await student.save();

    await logActivity({
      req,
      action: 'STUDENT_UPDATE',
      entityType: 'Student',
      entityId: student._id.toString(),
      details: { fullName: student.fullName },
    });

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStudentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'inactive' | 'transferred'

    if (!['active', 'inactive', 'transferred'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    student.status = status;
    await student.save();

    await logActivity({
      req,
      action: status === 'active' ? 'STUDENT_RESTORE' : 'STUDENT_DEACTIVATE',
      entityType: 'Student',
      entityId: student._id.toString(),
      details: { fullName: student.fullName, newStatus: status },
    });

    res.json({
      success: true,
      message: `Student marked as ${status} successfully`,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendanceHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const student = await Student.findById(id).populate('classId', 'name grade');
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const filter: any = { studentId: id };
    if (startDate && endDate) {
      filter.schoolDate = { $gte: String(startDate), $lte: String(endDate) };
    }

    const records = await AttendanceRecord.find(filter)
      .sort({ schoolDate: -1 })
      .lean();

    const totalDays = records.length;
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

    const percentage =
      totalDays > 0 ? Math.round(((present + late + halfDay * 0.5) / totalDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        student,
        stats: {
          totalDays,
          present,
          absent,
          late,
          leave,
          halfDay,
          percentage,
        },
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const importStudentsCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rows, classId, section, isCommit } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'No rows provided for import' });
      return;
    }

    if (!classId || !section) {
      res.status(400).json({ success: false, message: 'Class and section are required for import' });
      return;
    }

    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    const validRows: any[] = [];
    const invalidRows: { row: number; data: any; errors: string[] }[] = [];

    // Pre-fetch existing admissions and rolls in this section
    const existingAdmissions = new Set(
      (await Student.find({}, 'admissionNumber')).map((s) => s.admissionNumber.toUpperCase())
    );

    const existingRolls = new Set(
      (
        await Student.find(
          { classId, section: section.toUpperCase(), status: 'active' },
          'rollNumber'
        )
      ).map((s) => s.rollNumber)
    );

    const batchAdmissionSeen = new Set<string>();
    const batchRollSeen = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const errors: string[] = [];

      const fullName = (row.fullName || row.name || '').trim();
      const admissionNumber = (row.admissionNumber || row.admissionNo || '').trim().toUpperCase();
      const rollNumber = String(row.rollNumber || row.rollNo || '').trim();
      const guardianName = (row.guardianName || row.fatherName || row.parentName || '').trim();
      const guardianPhone = String(row.guardianPhone || row.phone || row.mobile || '').trim();
      const gender = (row.gender || 'Male').trim();

      if (!fullName) errors.push('Full name is required');
      if (!admissionNumber) errors.push('Admission number is required');
      if (!rollNumber) errors.push('Roll number is required');
      if (!guardianName) errors.push('Guardian name is required');
      if (!guardianPhone || guardianPhone.length < 10) errors.push('Valid 10-digit phone number is required');

      if (admissionNumber) {
        if (existingAdmissions.has(admissionNumber) || batchAdmissionSeen.has(admissionNumber)) {
          errors.push(`Admission number '${admissionNumber}' already exists in database or batch.`);
        } else {
          batchAdmissionSeen.add(admissionNumber);
        }
      }

      if (rollNumber) {
        if (existingRolls.has(rollNumber) || batchRollSeen.has(rollNumber)) {
          errors.push(`Roll number '${rollNumber}' is already occupied in this section.`);
        } else {
          batchRollSeen.add(rollNumber);
        }
      }

      if (errors.length > 0) {
        invalidRows.push({ row: rowNum, data: row, errors });
      } else {
        validRows.push({
          fullName,
          admissionNumber,
          rollNumber,
          classId,
          section: section.toUpperCase(),
          guardianName,
          guardianPhone,
          guardianEmail: row.guardianEmail || '',
          gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Male',
          address: row.address || '',
          emergencyContact: row.emergencyContact || guardianPhone,
          status: 'active',
        });
      }
    });

    if (isCommit && validRows.length > 0) {
      await Student.insertMany(validRows);
      await logActivity({
        req,
        action: 'STUDENT_CSV_IMPORT',
        entityType: 'Student',
        details: { importedCount: validRows.length, classId, section },
      });
    }

    res.json({
      success: true,
      isCommitted: Boolean(isCommit),
      totalProcessed: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows: isCommit ? [] : validRows,
      invalidRows,
    });
  } catch (error) {
    next(error);
  }
};

export const exportStudentsCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section, status } = req.query;
    const query: any = {};
    if (classId) query.classId = classId;
    if (section) query.section = String(section).toUpperCase();
    if (status) query.status = status;

    const students = await Student.find(query)
      .populate('classId', 'name grade')
      .sort({ rollNumber: 1, fullName: 1 })
      .lean();

    const headers = [
      'Admission Number',
      'Roll Number',
      'Full Name',
      'Class',
      'Section',
      'Gender',
      'Guardian Name',
      'Guardian Phone',
      'Status',
    ];

    const csvRows = [headers.join(',')];

    students.forEach((s: any) => {
      const row = [
        `"${s.admissionNumber || ''}"`,
        `"${s.rollNumber || ''}"`,
        `"${s.fullName || ''}"`,
        `"${s.classId?.name || ''}"`,
        `"${s.section || ''}"`,
        `"${s.gender || ''}"`,
        `"${s.guardianName || ''}"`,
        `"${s.guardianPhone || ''}"`,
        `"${s.status || ''}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students-export.csv"');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

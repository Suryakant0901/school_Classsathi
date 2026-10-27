import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { logActivity } from '../utils/auditLogger.js';
import { createClassSchema, updateClassSchema, transferStudentSchema } from '../validators/schemas.js';

export const getClasses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const classes = await Class.find()
      .populate('sectionTeachers.teacherId', 'name email phone')
      .populate('academicYearId', 'name isCurrent')
      .sort({ name: 1 })
      .lean();

    // Attach student count to each class
    const classesWithStats = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({
          classId: cls._id,
          status: 'active',
        });

        // Counts per section
        const sectionCounts: Record<string, number> = {};
        for (const sec of cls.sections) {
          sectionCounts[sec] = await Student.countDocuments({
            classId: cls._id,
            section: sec,
            status: 'active',
          });
        }

        return {
          ...cls,
          studentCount,
          sectionCounts,
        };
      })
    );

    res.json({
      success: true,
      data: classesWithStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getClassById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id)
      .populate('sectionTeachers.teacherId', 'name email')
      .populate('academicYearId', 'name');

    if (!cls) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    res.json({
      success: true,
      data: cls,
    });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createClassSchema.parse(req.body);

    // If academicYearId not provided, link to current academic year
    let academicYearId = validated.academicYearId;
    if (!academicYearId) {
      const currentYear = await AcademicYear.findOne({ isCurrent: true });
      if (currentYear) {
        academicYearId = currentYear._id.toString();
      }
    }

    const newClass = await Class.create({
      ...validated,
      academicYearId,
    });

    await logActivity({
      req,
      action: 'CLASS_CREATE',
      entityType: 'Class',
      entityId: newClass._id.toString(),
      details: { name: newClass.name, sections: newClass.sections },
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = updateClassSchema.parse(req.body);

    const updatedClass = await Class.findByIdAndUpdate(id, validated, {
      new: true,
      runValidators: true,
    });

    if (!updatedClass) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    await logActivity({
      req,
      action: 'CLASS_UPDATE',
      entityType: 'Class',
      entityId: String(id),
      details: validated,
    });

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
};

export const getClassStudents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { section } = req.query;

    const query: any = { classId: id, status: 'active' };
    if (section) {
      query.section = String(section).toUpperCase();
    }

    const students = await Student.find(query)
      .sort({ rollNumber: 1, fullName: 1 })
      .lean();

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const transferStudent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // studentId
    const validated = transferStudentSchema.parse(req.body);

    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Check if new roll number is already taken in the target class and section
    const existingRoll = await Student.findOne({
      classId: validated.targetClassId,
      section: validated.targetSection.toUpperCase(),
      rollNumber: validated.newRollNumber.trim(),
      status: 'active',
      _id: { $ne: student._id },
    });

    if (existingRoll) {
      res.status(400).json({
        success: false,
        message: `Roll number ${validated.newRollNumber} is already occupied in target class/section by ${existingRoll.fullName}.`,
      });
      return;
    }

    const previousClass = student.classId;
    const previousSection = student.section;
    const previousRoll = student.rollNumber;

    student.classId = validated.targetClassId as any;
    student.section = validated.targetSection.toUpperCase();
    student.rollNumber = validated.newRollNumber.trim();
    await student.save();

    await logActivity({
      req,
      action: 'STUDENT_TRANSFER',
      entityType: 'Student',
      entityId: student._id.toString(),
      details: {
        studentName: student.fullName,
        from: { classId: previousClass, section: previousSection, roll: previousRoll },
        to: { classId: student.classId, section: student.section, roll: student.rollNumber },
      },
    });

    res.json({
      success: true,
      message: 'Student transferred successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

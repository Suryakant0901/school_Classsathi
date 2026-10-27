import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Exam } from '../models/Exam.js';
import { ExamResult } from '../models/ExamResult.js';
import { Student } from '../models/Student.js';
import { logActivity } from '../utils/auditLogger.js';
import { createExamSchema, saveExamMarksSchema } from '../validators/schemas.js';

export const getExams = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { classId, section, subject, status } = req.query;
    const filter: any = {};

    if (classId) filter.classId = classId;
    if (section) filter.section = String(section).toUpperCase();
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const exams = await Exam.find(filter)
      .populate('classId', 'name grade')
      .populate('createdBy', 'name')
      .sort({ examDate: -1 })
      .lean();

    res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createExamSchema.parse(req.body);
    const user = req.user!;

    const exam = await Exam.create({
      ...validated,
      section: validated.section.toUpperCase(),
      createdBy: user._id,
    });

    await logActivity({
      req,
      action: 'EXAM_CREATE',
      entityType: 'Exam',
      entityId: exam._id.toString(),
      details: { title: exam.title, subject: exam.subject, maxMarks: exam.maxMarks },
    });

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

export const getExamResults = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // examId
    const exam = await Exam.findById(id).populate('classId', 'name grade');
    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    // Active students in class & section
    const students = await Student.find({
      classId: exam.classId,
      section: exam.section,
      status: 'active',
    })
      .sort({ rollNumber: 1, fullName: 1 })
      .lean();

    // Existing results
    const existingResults = await ExamResult.find({ examId: exam._id }).lean();
    const resultMap = new Map<string, any>();
    existingResults.forEach((r) => {
      resultMap.set(r.studentId.toString(), r);
    });

    const studentMarks = students.map((stu) => {
      const res = resultMap.get(stu._id.toString());
      return {
        studentId: stu._id,
        fullName: stu.fullName,
        admissionNumber: stu.admissionNumber,
        rollNumber: stu.rollNumber,
        marksObtained: res ? res.marksObtained : 0,
        isAbsent: res ? res.isAbsent : false,
        remarks: res ? res.remarks || '' : '',
        isEntered: Boolean(res),
      };
    });

    res.json({
      success: true,
      data: {
        exam,
        students: studentMarks,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const saveExamMarks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = saveExamMarksSchema.parse(req.body);
    const { examId, results } = validated;
    const user = req.user!;

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    // Validate that marks do not exceed maxMarks
    for (const r of results) {
      if (!r.isAbsent && r.marksObtained > exam.maxMarks) {
        res.status(400).json({
          success: false,
          message: `Marks entered (${r.marksObtained}) cannot exceed maximum allowed marks (${exam.maxMarks}).`,
        });
        return;
      }
    }

    const bulkOps = results.map((r) => ({
      updateOne: {
        filter: { examId, studentId: r.studentId },
        update: {
          $set: {
            classId: exam.classId,
            marksObtained: r.isAbsent ? 0 : r.marksObtained,
            isAbsent: r.isAbsent,
            remarks: r.remarks || '',
            updatedBy: user._id,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await ExamResult.bulkWrite(bulkOps);
    }

    exam.status = 'graded';
    await exam.save();

    await logActivity({
      req,
      action: 'EXAM_MARKS_SAVE',
      entityType: 'Exam',
      entityId: exam._id.toString(),
      details: { title: exam.title, totalGraded: results.length },
    });

    res.json({
      success: true,
      message: 'Exam marks saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

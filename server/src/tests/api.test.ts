import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';

describe('ClassSathi Core API Test Suite', () => {
  let adminToken: string;
  let teacherToken: string;
  let testClassId: string;
  let testStudentId: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. GET /api/health - verifies server health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ClassSathi API');
  });

  it('2. POST /api/v1/auth/login - valid admin login', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@classsathi.com',
      password: 'Admin@123456',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
    adminToken = res.body.token;
  });

  it('3. POST /api/v1/auth/login - teacher login', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@classsathi.com',
      password: 'Teacher@123456',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('teacher');
    teacherToken = res.body.token;
  });

  it('4. POST /api/v1/auth/login - rejects invalid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@classsathi.com',
      password: 'WrongPassword123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('5. GET /api/v1/auth/me - gets authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@classsathi.com');
  });

  it('6. GET /api/v1/dashboard/summary - returns live DB metrics', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.totalStudents).toBeGreaterThan(0);
    expect(res.body.data.stats.totalClasses).toBeGreaterThan(0);
  });

  it('7. GET /api/v1/classes - lists active classes', async () => {
    const res = await request(app)
      .get('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    testClassId = res.body.data[0]._id;
  });

  it('8. GET /api/v1/students - lists students with pagination', async () => {
    const res = await request(app)
      .get(`/api/v1/students?classId=${testClassId}&section=A`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    testStudentId = res.body.data[0]._id;
  });

  it('9. POST /api/v1/students - rejects duplicate admission number', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Duplicate Test Student',
        admissionNumber: 'ADM-2026-1001', // Already seeded
        rollNumber: '99',
        classId: testClassId,
        section: 'A',
        guardianName: 'Test Parent',
        guardianPhone: '9871109999',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('10. GET /api/v1/attendance/roster - fetches class roster for marking', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/roster?classId=${testClassId}&section=A&schoolDate=2026-10-17`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.roster)).toBe(true);
    expect(res.body.data.roster.length).toBeGreaterThan(0);
  });

  it('11. POST /api/v1/attendance/save - saves roster submission and updates stats', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/save')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: testClassId,
        section: 'A',
        schoolDate: '2026-10-18', // New date
        records: [
          { studentId: testStudentId, status: 'present', remarks: 'On time' },
        ],
        isSubmitting: true,
        notes: 'Regular morning attendance',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.status).toBe('submitted');
  });

  it('12. POST /api/v1/attendance/correct - corrects attendance record with audit reason', async () => {
    // Fetch record for testStudentId on 2026-10-18
    const rosterRes = await request(app)
      .get(`/api/v1/attendance/roster?classId=${testClassId}&section=A&schoolDate=2026-10-18`)
      .set('Authorization', `Bearer ${adminToken}`);

    const studentRecord = rosterRes.body.data.roster.find((r: any) => r.studentId === testStudentId);
    expect(studentRecord).toBeDefined();
    expect(studentRecord.recordId).toBeDefined();

    const correctRes = await request(app)
      .post('/api/v1/attendance/correct')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recordId: studentRecord.recordId,
        newStatus: 'late',
        reason: 'Student arrived 20 minutes late due to bus breakdown',
      });

    expect(correctRes.status).toBe(200);
    expect(correctRes.body.success).toBe(true);
    expect(correctRes.body.data.record.status).toBe('late');
    expect(correctRes.body.data.session.status).toBe('corrected');
  });

  it('13. GET /api/v1/reports/summary - verifies reports calculation', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/summary?classId=${testClassId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalSessions).toBeGreaterThan(0);
    expect(res.body.data.summary.averagePercentage).toBeGreaterThanOrEqual(0);
  });
});

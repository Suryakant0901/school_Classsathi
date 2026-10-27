import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Student } from '../types/index.js';
import { AttendanceStatusBadge } from '../components/ui/AttendanceStatusBadge.js';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';

export const StudentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'profile'>('attendance');

  useEffect(() => {
    const fetchStudentHistory = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<{
          success: boolean;
          data: { student: Student; stats: any; records: any[] };
        }>(`/students/${id}/attendance`);

        if (res.success) {
          setStudent(res.data.student);
          setStats(res.data.stats);
          setRecords(res.data.records);
        }
      } catch {
        // error
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStudentHistory();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
        Loading student profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-600 font-bold">Student record not found</p>
        <button
          onClick={() => navigate('/students')}
          className="mt-4 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
            Student Profile & Attendance History
          </h2>
          <p className="text-xs text-slate-500">
            Admission No: <span className="font-mono font-bold">{student.admissionNumber}</span>
          </p>
        </div>
      </div>

      {/* Student Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-teal text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-teal-900/20 flex-shrink-0">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-extrabold text-slate-800">{student.fullName}</h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                  student.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {student.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold mt-1">
              <span>Class: {student.classId?.name} - {student.section}</span>
              <span>•</span>
              <span>Roll Number: #{student.rollNumber}</span>
              <span>•</span>
              <span>Gender: {student.gender}</span>
            </div>
          </div>
        </div>

        {/* Attendance Rate Big Metric */}
        {stats && (
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-shrink-0">
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Overall Attendance
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold ${
                  stats.percentage >= 75 ? 'text-brand-teal' : 'text-rose-600'
                }`}
              >
                {stats.percentage}%
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stats.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Working Days</span>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{stats.totalDays}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-center">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Present Days</span>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">{stats.present}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-center">
            <span className="text-[11px] font-bold text-rose-600 uppercase">Absent Days</span>
            <p className="text-xl font-extrabold text-rose-700 mt-1">{stats.absent}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-center">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Late Arrivals</span>
            <p className="text-xl font-extrabold text-amber-700 mt-1">{stats.late}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-center">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Approved Leave</span>
            <p className="text-xl font-extrabold text-blue-700 mt-1">{stats.leave}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'attendance'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daily Attendance History
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Guardian & Contact Details
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'attendance' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          {records.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No daily attendance records found for this student.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-right">Recorded On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{r.schoolDate}</td>
                      <td className="py-3 px-4">
                        <AttendanceStatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {r.remarks || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card max-w-2xl space-y-4">
          <h4 className="text-base font-bold text-slate-800 border-b pb-3 border-slate-100">
            Parent & Guardian Contact Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase">Guardian Name</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{student.guardianName}</p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase">Guardian Mobile</span>
              <p className="text-sm font-semibold text-brand-teal mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{student.guardianPhone}</span>
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase">Guardian Email</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {student.guardianEmail || 'Not provided'}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase">Admission Date</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-bold text-slate-400 uppercase">Residential Address</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {student.address || 'Address not registered'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { ClassItem } from '../types/index.js';
import {
  FileBarChart,
  Download,
  Printer,
  AlertTriangle,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'low-attendance' ? 'low-attendance' : 'summary';

  const [activeTab, setActiveTab] = useState<'summary' | 'student-wise' | 'low-attendance'>(
    initialType as any
  );
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Data
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [studentWiseData, setStudentWiseData] = useState<any[]>([]);
  const [lowAttendanceData, setLowAttendanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get<{ success: boolean; data: ClassItem[] }>('/classes');
        if (res.success && res.data.length > 0) {
          setClasses(res.data);
          setSelectedClassId(res.data[0]._id);
        }
      } catch {
        // error
      }
    };
    fetchClasses();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'summary') {
        const res = await api.get<{ success: boolean; data: any }>(
          `/reports/summary${selectedClassId ? `?classId=${selectedClassId}` : ''}`
        );
        if (res.success) setSummaryData(res.data);
      } else if (activeTab === 'student-wise') {
        const res = await api.get<{ success: boolean; data: any[] }>(
          `/reports/student-wise${selectedClassId ? `?classId=${selectedClassId}` : ''}`
        );
        if (res.success) setStudentWiseData(res.data);
      } else if (activeTab === 'low-attendance') {
        const res = await api.get<{ success: boolean; data: any[] }>(
          `/reports/low-attendance${selectedClassId ? `?classId=${selectedClassId}` : ''}`
        );
        if (res.success) setLowAttendanceData(res.data);
      }
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (selectedClassId) params.append('classId', selectedClassId);
    if (selectedSection) params.append('section', selectedSection);
    window.open(`/api/v1/reports/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-brand-teal" />
            <span>Attendance Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified official attendance calculations, registers, low-attendance alerts, and exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'summary'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          School Summary Register
        </button>

        <button
          onClick={() => setActiveTab('student-wise')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'student-wise'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Student-wise Report
        </button>

        <button
          onClick={() => setActiveTab('low-attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'low-attendance'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-rose-600 bg-rose-50 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Attendance Alert (&lt;75%)</span>
        </button>
      </div>

      {/* Report Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 sm:p-6 print-page">
        {/* Printable Header */}
        <div className="mb-4 text-center border-b pb-3 border-slate-200">
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
            Official Attendance Report
          </h1>
          <p className="text-xs text-slate-500">
            Government Model Senior Secondary School • ClassSathi System • Session 2026-27
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Generating report data...
          </div>
        ) : activeTab === 'summary' ? (
          <div>
            {/* Aggregate Metrics Bar */}
            {summaryData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Total Sessions</span>
                  <span className="text-xl font-extrabold text-slate-800">
                    {summaryData.summary.totalSessions}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-600 font-bold uppercase block">
                    Total Present Marks
                  </span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    {summaryData.summary.aggregatePresent}
                  </span>
                </div>
                <div>
                  <span className="text-rose-600 font-bold uppercase block">
                    Total Absent Marks
                  </span>
                  <span className="text-xl font-extrabold text-rose-700">
                    {summaryData.summary.aggregateAbsent}
                  </span>
                </div>
                <div>
                  <span className="text-brand-teal font-bold uppercase block">
                    Average Attendance
                  </span>
                  <span className="text-xl font-extrabold text-brand-teal">
                    {summaryData.summary.averagePercentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Sessions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase text-[10px] text-slate-600 border-b border-slate-200">
                    <th className="p-3">School Date</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Section</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-center">Absent</th>
                    <th className="p-3 text-center">Late</th>
                    <th className="p-3 text-center">Leave</th>
                    <th className="p-3 text-right">Submitted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryData?.sessions.map((s: any) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{s.schoolDate}</td>
                      <td className="p-3 font-semibold text-slate-700">{s.classId?.name}</td>
                      <td className="p-3">{s.section}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {s.summary.present}
                      </td>
                      <td className="p-3 text-center font-bold text-rose-700">{s.summary.absent}</td>
                      <td className="p-3 text-center font-bold text-amber-700">{s.summary.late}</td>
                      <td className="p-3 text-center font-bold text-blue-700">{s.summary.leave}</td>
                      <td className="p-3 text-right text-slate-500">
                        {s.markedBy?.name || 'Class Teacher'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'student-wise' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold uppercase text-[10px] text-slate-600 border-b border-slate-200">
                  <th className="p-3 w-12 text-center">Roll</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class & Sec</th>
                  <th className="p-3 text-center">Total Working Days</th>
                  <th className="p-3 text-center text-emerald-700">Present</th>
                  <th className="p-3 text-center text-rose-700">Absent</th>
                  <th className="p-3 text-center text-amber-700">Late</th>
                  <th className="p-3 text-center text-blue-700">Leave</th>
                  <th className="p-3 text-center font-extrabold">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentWiseData.map((stu) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-extrabold text-slate-700">
                      {stu.rollNumber}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{stu.fullName}</td>
                    <td className="p-3">
                      {stu.class} - {stu.section}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {stu.totalSessions}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700">{stu.present}</td>
                    <td className="p-3 text-center font-bold text-rose-700">{stu.absent}</td>
                    <td className="p-3 text-center font-bold text-amber-700">{stu.late}</td>
                    <td className="p-3 text-center font-bold text-blue-700">{stu.leave}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded-full ${
                          stu.percentage >= 75
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {stu.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 font-semibold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  The following students have fallen below the mandatory 75% attendance threshold.
                </span>
              </div>
              <span className="font-extrabold">{lowAttendanceData.length} students affected</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-100/60 font-bold uppercase text-[10px] text-rose-900 border-b border-rose-200">
                    <th className="p-3 text-center">Roll</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3 text-center">Present / Total Days</th>
                    <th className="p-3 text-center">Attendance %</th>
                    <th className="p-3">Guardian Name & Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowAttendanceData.map((stu) => (
                    <tr key={stu.studentId} className="hover:bg-rose-50/30">
                      <td className="p-3 text-center font-extrabold text-slate-700">
                        {stu.rollNumber}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{stu.fullName}</td>
                      <td className="p-3">
                        {stu.class} - {stu.section}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-600">
                        {stu.present} / {stu.totalSessions} days
                      </td>
                      <td className="p-3 text-center font-extrabold text-rose-600">
                        {stu.percentage}%
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{stu.guardianName}</span>
                        <span className="text-slate-400 block text-[11px]">
                          {stu.guardianPhone}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

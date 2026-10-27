import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  ClassItem,
  AttendanceRosterItem,
  AttendanceStatusType,
  AttendanceSession,
} from '../types/index.js';
import { AttendanceStatusBadge } from '../components/ui/AttendanceStatusBadge.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import { getTodayISODate } from '../lib/utils.js';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  AlertCircle,
  Save,
  Send,
  Edit3,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISODate());

  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Confirmation Modals
  const [isMarkAllAbsentOpen, setIsMarkAllAbsentOpen] = useState(false);

  // Correction Modal
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRosterItem | null>(null);
  const [correctionNewStatus, setCorrectionNewStatus] = useState<AttendanceStatusType>('present');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Load available classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get<{ success: boolean; data: ClassItem[] }>('/classes');
        if (res.success && res.data.length > 0) {
          setClasses(res.data);
          setSelectedClassId(res.data[0]._id);
          if (res.data[0].sections.length > 0) {
            setSelectedSection(res.data[0].sections[0]);
          }
        }
      } catch {
        // handle error
      }
    };
    fetchClasses();
  }, []);

  // Fetch roster when class, section, or date changes
  const fetchRoster = async () => {
    if (!selectedClassId || !selectedSection || !selectedDate) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await api.get<{
        success: boolean;
        data: {
          session: AttendanceSession | null;
          roster: AttendanceRosterItem[];
        };
      }>(
        `/attendance/roster?classId=${selectedClassId}&section=${selectedSection}&schoolDate=${selectedDate}`
      );

      if (res.success) {
        setRoster(res.data.roster);
        setSession(res.data.session);
        setHasUnsavedChanges(false);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load class roster', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedClassId, selectedSection, selectedDate]);

  // Warn before leaving if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Status marking helper
  const handleSetStatus = (studentId: string, status: AttendanceStatusType) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleSetRemarks = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
    setHasUnsavedChanges(true);
  };

  // Bulk actions
  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'present' })));
    setHasUnsavedChanges(true);
  };

  const handleConfirmMarkAllAbsent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'absent' })));
    setHasUnsavedChanges(true);
    setIsMarkAllAbsentOpen(false);
  };

  // Save or Submit Attendance
  const handleSaveAttendance = async (isSubmitting: boolean) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const recordsToSave = roster
        .filter((r) => r.status !== null)
        .map((r) => ({
          studentId: r.studentId,
          status: r.status as AttendanceStatusType,
          remarks: r.remarks || '',
        }));

      const res = await api.post<{
        success: boolean;
        message: string;
        data: { session: AttendanceSession };
      }>('/attendance/save', {
        classId: selectedClassId,
        section: selectedSection,
        schoolDate: selectedDate,
        records: recordsToSave,
        isSubmitting,
      });

      if (res.success) {
        setHasUnsavedChanges(false);
        setMessage({ text: res.message, type: 'success' });
        await fetchRoster();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error saving attendance records', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Correction
  const handleOpenCorrection = (item: AttendanceRosterItem) => {
    setCorrectionTarget(item);
    setCorrectionNewStatus((item.status as AttendanceStatusType) || 'present');
    setCorrectionReason('');
  };

  const handleSubmitCorrection = async () => {
    if (!correctionTarget || !correctionTarget.recordId) return;
    if (!correctionReason.trim()) {
      alert('Correction reason is mandatory.');
      return;
    }

    setIsCorrecting(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/attendance/correct', {
        recordId: correctionTarget.recordId,
        newStatus: correctionNewStatus,
        reason: correctionReason,
      });

      if (res.success) {
        setCorrectionTarget(null);
        setMessage({ text: 'Attendance record corrected and audited.', type: 'success' });
        await fetchRoster();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction.');
    } finally {
      setIsCorrecting(false);
    }
  };

  // Live Counts
  const totalStudents = roster.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let halfDayCount = 0;
  let unmarkedCount = 0;

  roster.forEach((r) => {
    if (r.status === 'present') presentCount++;
    else if (r.status === 'absent') absentCount++;
    else if (r.status === 'late') lateCount++;
    else if (r.status === 'leave') leaveCount++;
    else if (r.status === 'half_day') halfDayCount++;
    else unmarkedCount++;
  });

  // Filtered Roster
  const filteredRoster = roster.filter((stu) => {
    const matchesSearch =
      stu.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'unmarked'
        ? stu.status === null
        : stu.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const selectedClass = classes.find((c) => c._id === selectedClassId);
  const isSubmitted = session?.status === 'submitted' || session?.status === 'corrected';

  return (
    <div className="space-y-6 pb-20">
      {/* Header Selector Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-teal"></span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                Daily Classroom Attendance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select class, section, and date to record or verify student presence.
            </p>
          </div>

          {/* Session Status Badge */}
          {session && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Session Status:</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  session.status === 'submitted'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : session.status === 'corrected'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {session.status}
              </span>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {/* Class Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const found = classes.find((c) => c._id === e.target.value);
                if (found && found.sections.length > 0) {
                  setSelectedSection(found.sections[0]);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} (Grade {cls.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
            >
              {selectedClass?.sections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Attendance Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Summary & Bulk Actions Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Live Status Counter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            Total: {totalStudents}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Present: {presentCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Absent: {absentCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Late: {lateCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Leave: {leaveCount}</span>
          </div>
          {unmarkedCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
              Unmarked: {unmarkedCount}
            </div>
          )}
        </div>

        {/* Quick Marking Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMarkAllAbsentOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Roster Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs font-bold text-slate-600">
          <span>Filter:</span>
          {['all', 'unmarked', 'present', 'absent', 'late', 'leave'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-brand-navy text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Roster Table / Card List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Loading class roster...
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Info className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-600">No students found matching filter</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing search or check class enrollment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-16">Roll</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Admission No</th>
                  <th className="py-3.5 px-4 text-center">Attendance Status</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Remarks</th>
                  {isSubmitted && <th className="py-3.5 px-4 text-right">Correct</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRoster.map((student) => {
                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Roll Number Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 font-extrabold text-slate-700 text-xs">
                          {student.rollNumber}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 leading-tight">
                          {student.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 md:hidden mt-0.5">
                          Adm: {student.admissionNumber}
                        </div>
                      </td>

                      {/* Admission No (desktop) */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs font-semibold text-slate-500">
                        {student.admissionNumber}
                      </td>

                      {/* Large Touch Status Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.studentId, 'present')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                              student.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            P
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.studentId, 'absent')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                              student.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            A
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.studentId, 'late')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                              student.status === 'late'
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            L
                          </button>

                          {/* Leave Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.studentId, 'leave')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              student.status === 'leave'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            LV
                          </button>

                          {/* Half Day Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.studentId, 'half_day')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              student.status === 'half_day'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                            }`}
                          >
                            H
                          </button>
                        </div>
                      </td>

                      {/* Remarks (Desktop) */}
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <input
                          type="text"
                          placeholder="Optional notes..."
                          value={student.remarks || ''}
                          onChange={(e) => handleSetRemarks(student.studentId, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-teal"
                        />
                      </td>

                      {/* Correct Link if session already submitted */}
                      {isSubmitted && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenCorrection(student)}
                            className="p-1.5 text-slate-400 hover:text-brand-teal hover:bg-teal-50 rounded-lg transition-colors"
                            title="Correct attendance with audit log"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-30 shadow-elevated">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Unsaved Changes
              </span>
            ) : isSubmitted ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Session Submitted
              </span>
            ) : (
              <span className="text-slate-500">Roster loaded</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Save Draft */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAttendance(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            {/* Submit Attendance */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAttendance(true)}
              className="px-5 py-2.5 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-teal/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>Submit Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mark All Absent Confirmation */}
      <ConfirmModal
        isOpen={isMarkAllAbsentOpen}
        title="Mark All Students Absent?"
        message="Are you sure you want to mark all students in this class as Absent? You can still adjust individual statuses before saving."
        confirmText="Yes, Mark All Absent"
        isDestructive={true}
        onConfirm={handleConfirmMarkAllAbsent}
        onCancel={() => setIsMarkAllAbsentOpen(false)}
      />

      {/* Attendance Correction Modal */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-800">
              Correct Attendance Record
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Changes to submitted attendance require a mandatory explanation for school audit compliance.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-800 text-sm">
                {correctionTarget.fullName} (Roll #{correctionTarget.rollNumber})
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Current Status: <span className="font-bold uppercase">{correctionTarget.status}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Status
                </label>
                <select
                  value={correctionNewStatus}
                  onChange={(e) => setCorrectionNewStatus(e.target.value as AttendanceStatusType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="leave">Approved Leave</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Correction (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Student reported late due to morning transport breakdown..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCorrecting}
                onClick={handleSubmitCorrection}
                className="px-4 py-2 bg-brand-teal hover:bg-brand-tealDark text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {isCorrecting ? 'Saving...' : 'Save Correction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

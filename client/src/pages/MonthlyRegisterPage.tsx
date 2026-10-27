import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ClassItem } from '../types/index.js';
import { Printer, Calendar, ArrowLeft, ArrowRight, Download, Filter } from 'lucide-react';

export const MonthlyRegisterPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('A');

  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1); // 1-12

  const [registerData, setRegisterData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        // error
      }
    };
    fetchClasses();
  }, []);

  const fetchRegister = async () => {
    if (!selectedClassId || !selectedSection) return;
    setIsLoading(true);

    try {
      const res = await api.get<{ success: boolean; data: any }>(
        `/attendance/monthly-register?classId=${selectedClassId}&section=${selectedSection}&year=${year}&month=${month}`
      );
      if (res.success) {
        setRegisterData(res.data);
      }
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, [selectedClassId, selectedSection, year, month]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-teal" />
            <span>Monthly Attendance Register</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete day-by-day attendance log for the selected class and month.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Class Selector */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const found = classes.find((c) => c._id === e.target.value);
              if (found && found.sections.length > 0) {
                setSelectedSection(found.sections[0]);
              }
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Section Selector */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            {selectedClass?.sections.map((sec) => (
              <option key={sec} value={sec}>
                Sec {sec}
              </option>
            ))}
          </select>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Printable Register Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 sm:p-6 print-page overflow-x-auto">
        {/* Printable School Header */}
        <div className="mb-4 text-center border-b pb-3 border-slate-200">
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
            Monthly Student Attendance Register
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Class: <span className="font-bold">{selectedClass?.name} - {selectedSection}</span> •
            Month: <span className="font-bold">{monthNames[month - 1]} {year}</span> • Session: 2026-27
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Loading monthly register...
          </div>
        ) : !registerData || registerData.students.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No student attendance records found for this month.
          </div>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-2 border border-slate-300 text-center w-8">#</th>
                <th className="p-2 border border-slate-300 text-left min-w-[140px]">Student Name</th>
                {registerData.dayColumns.map((dateStr: string, idx: number) => {
                  const dayNum = idx + 1;
                  return (
                    <th
                      key={dateStr}
                      className="p-1 border border-slate-300 text-center w-7 font-mono text-[10px]"
                    >
                      {dayNum}
                    </th>
                  );
                })}
                <th className="p-2 border border-slate-300 text-center w-10 bg-emerald-50">P</th>
                <th className="p-2 border border-slate-300 text-center w-10 bg-rose-50">A</th>
                <th className="p-2 border border-slate-300 text-center w-12 bg-teal-50">%</th>
              </tr>
            </thead>
            <tbody>
              {registerData.students.map((stu: any) => {
                return (
                  <tr key={stu.studentId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-600">
                      {stu.rollNumber}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-semibold text-slate-800 whitespace-nowrap">
                      {stu.fullName}
                    </td>

                    {/* Daily Status Cells */}
                    {registerData.dayColumns.map((dateStr: string) => {
                      const st = stu.attendanceByDay[dateStr];
                      let cellContent = '-';
                      let colorClass = 'text-slate-300';

                      if (st === 'present') {
                        cellContent = 'P';
                        colorClass = 'text-emerald-700 font-bold bg-emerald-50/50';
                      } else if (st === 'absent') {
                        cellContent = 'A';
                        colorClass = 'text-rose-700 font-bold bg-rose-50';
                      } else if (st === 'late') {
                        cellContent = 'L';
                        colorClass = 'text-amber-700 font-bold bg-amber-50';
                      } else if (st === 'leave') {
                        cellContent = 'LV';
                        colorClass = 'text-blue-700 font-bold bg-blue-50';
                      } else if (st === 'half_day') {
                        cellContent = 'H';
                        colorClass = 'text-purple-700 font-bold bg-purple-50';
                      }

                      return (
                        <td
                          key={dateStr}
                          className={`p-1 border border-slate-300 text-center font-mono text-[10px] ${colorClass}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}

                    {/* Aggregate Columns */}
                    <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">
                      {stu.stats.presentCount}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold text-rose-700 bg-rose-50/30">
                      {stu.stats.absentCount}
                    </td>
                    <td
                      className={`p-1.5 border border-slate-300 text-center font-extrabold ${
                        stu.stats.percentage < 75
                          ? 'text-rose-600 bg-rose-50'
                          : 'text-brand-teal bg-teal-50/30'
                      }`}
                    >
                      {stu.stats.percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <span className="font-bold">P</span>: Present
            </span>
            <span className="flex items-center gap-1 font-semibold text-rose-700">
              <span className="font-bold">A</span>: Absent
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <span className="font-bold">L</span>: Late
            </span>
            <span className="flex items-center gap-1 font-semibold text-blue-700">
              <span className="font-bold">LV</span>: Approved Leave
            </span>
            <span className="flex items-center gap-1 font-semibold text-purple-700">
              <span className="font-bold">H</span>: Half Day
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 sm:mt-0">
            Official ClassSathi Attendance Record • Verified by Class Teacher
          </div>
        </div>
      </div>
    </div>
  );
};

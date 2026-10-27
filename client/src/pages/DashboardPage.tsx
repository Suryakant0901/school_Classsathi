import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardData {
  today: string;
  schoolName: string;
  tagline: string;
  stats: {
    totalStudents: number;
    totalClasses: number;
    totalSections: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    leaveToday: number;
    halfDayToday: number;
    markedStudentsToday: number;
    attendanceRateToday: number;
    submittedSessionsCount: number;
    pendingSessionsCount: number;
    lowAttendanceCount: number;
  };
  recentActivities: any[];
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [classComparison, setClassComparison] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [summaryRes, trendsRes, comparisonRes] = await Promise.all([
        api.get<{ success: boolean; data: DashboardData }>('/dashboard/summary'),
        api.get<{ success: boolean; data: any[] }>('/dashboard/trends?days=7'),
        api.get<{ success: boolean; data: any[] }>('/dashboard/class-comparison'),
      ]);

      if (summaryRes.success) setData(summaryRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (comparisonRes.success) setClassComparison(comparisonRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Error Loading Dashboard</h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats } = data;

  // Donut chart status data
  const statusPieData = [
    { name: 'Present', value: stats.presentToday, color: '#16A34A' },
    { name: 'Absent', value: stats.absentToday, color: '#DC2626' },
    { name: 'Late', value: stats.lateToday, color: '#D97706' },
    { name: 'Leave', value: stats.leaveToday, color: '#2563EB' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-navyLight text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-bold mb-3 backdrop-blur-sm">
            <span>ClassSathi Pro</span> • <span>School Date: {data.today}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Classroom Overview & Daily Attendance
          </h2>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Quickly monitor real-time class attendance, detect students with low attendance, and maintain verified school registers.
          </p>
        </div>

        <div className="z-10 flex-shrink-0">
          <button
            onClick={() => navigate('/attendance')}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-teal hover:bg-brand-tealDark text-white font-bold rounded-2xl shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-95 text-sm"
          >
            <CheckSquare className="w-5 h-5" />
            <span>Mark Today's Attendance</span>
          </button>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Active Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {stats.totalStudents}
            </span>
            <span className="text-xs text-slate-500 font-medium">active enrolled</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Across {stats.totalClasses} classes, {stats.totalSections} sections
          </div>
        </div>

        {/* Today's Attendance Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.attendanceRateToday}%
            </span>
            <span className="text-xs text-slate-500 font-medium">present today</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {stats.markedStudentsToday} of {stats.totalStudents} marked
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Present Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {stats.presentToday}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              +{stats.lateToday} late
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Absent: {stats.absentToday} • Leave: {stats.leaveToday}
          </div>
        </div>

        {/* Low Attendance Review */}
        <div
          onClick={() => navigate('/reports?type=low-attendance')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low Attendance (&lt;75%)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats.lowAttendanceCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">students need attention</span>
          </div>
          <div className="mt-2 text-xs text-brand-teal font-semibold flex items-center gap-1 group-hover:underline">
            <span>View report</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Daily Attendance Trends</h3>
              <p className="text-xs text-slate-500">Past 7 School Days attendance percentage</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-brand-teal rounded-lg">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No attendance trend data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#0D9488"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Today's Distribution</h3>
            <p className="text-xs text-slate-500">Status breakdown for {data.today}</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center my-2">
            {statusPieData.length === 0 ? (
              <div className="text-center text-xs text-slate-400">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Attendance not yet submitted for today
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-slate-600">Present: {stats.presentToday}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span className="text-slate-600">Absent: {stats.absentToday}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <span className="text-slate-600">Late: {stats.lateToday}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-slate-600">Leave: {stats.leaveToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Class-wise Performance & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Comparison */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Class Attendance Comparison</h3>
              <p className="text-xs text-slate-500">Today's attendance percentage across active classes</p>
            </div>
            <button
              onClick={() => navigate('/classes')}
              className="text-xs text-brand-teal font-semibold hover:underline"
            >
              Manage Classes
            </button>
          </div>

          <div className="space-y-4">
            {classComparison.map((cls) => (
              <div key={cls.classId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand-teal" />
                    <span>{cls.className}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({cls.totalStudents} students)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        cls.isMarked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cls.isMarked ? `${cls.percentage}% Present` : 'Not Marked'}
                    </span>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="mt-2.5 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-teal h-2 rounded-full transition-all duration-500"
                    style={{ width: `${cls.isMarked ? cls.percentage : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Activity Log</h3>
              <p className="text-xs text-slate-500">Recent actions & updates</p>
            </div>
            <button
              onClick={() => navigate('/activity-logs')}
              className="text-xs text-brand-teal font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto">
            {data.recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent activity</p>
            ) : (
              data.recentActivities.map((act) => (
                <div key={act._id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-teal-50 text-brand-teal flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-slate-800 truncate">
                      {act.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">by {act.actorName}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

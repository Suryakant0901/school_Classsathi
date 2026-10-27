import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { SchoolNotification, SchoolSetting } from '../../types/index.js';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Bell,
  FileBarChart,
  UserCheck,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const AppLayout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [schoolSetting, setSchoolSetting] = useState<SchoolSetting | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch notifications and school settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const notifRes = await api.get<{
          success: boolean;
          data: { notifications: SchoolNotification[]; unreadCount: number };
        }>('/notifications');
        if (notifRes.success) {
          setNotifications(notifRes.data.notifications);
          setUnreadCount(notifRes.data.unreadCount);
        }

        const settingsRes = await api.get<{ success: boolean; data: SchoolSetting }>('/settings');
        if (settingsRes.success) {
          setSchoolSetting(settingsRes.data);
        }
      } catch {
        // Silently handle if not ready
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 45000); // refresh periodically
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // handle error
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Take Attendance', path: '/attendance', icon: CheckSquare, badge: 'Daily' },
    { label: 'Monthly Register', path: '/attendance/register', icon: CalendarDays },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Classes & Sections', path: '/classes', icon: GraduationCap },
    { label: 'Homework', path: '/homework', icon: BookOpen },
    { label: 'Exams & Marks', path: '/exams', icon: Award },
    { label: 'Notice Board', path: '/announcements', icon: Bell },
    { label: 'Reports & Analytics', path: '/reports', icon: FileBarChart },
  ];

  const adminNavItems = [
    { label: 'Teacher Accounts', path: '/users', icon: UserCheck },
    { label: 'Activity Logs', path: '/activity-logs', icon: History },
    { label: 'School Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-brand-bg font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-brand-navy text-white flex-shrink-0 shadow-xl z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-teal to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">ClassSathi</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-teal text-white uppercase tracking-wider">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-teal-200/80 font-medium truncate max-w-[150px]">
              {schoolSetting?.tagline || 'Teaching par focus'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Classroom & Students
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group',
                        isActive
                          ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/20'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {isAdmin && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Administration
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all group',
                          isActive
                            ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/20'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Profile & Logout in Sidebar */}
        <div className="p-3 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-brand-teal text-white font-bold flex items-center justify-center flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-teal-300 capitalize font-medium">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-brand-navy text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">ClassSathi</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      isActive ? 'bg-brand-teal text-white' : 'text-slate-300 hover:bg-white/10'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {isAdmin && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Administration
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                          isActive ? 'bg-brand-teal text-white' : 'text-slate-300 hover:bg-white/10'
                        )
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-rose-400 hover:bg-white/10 rounded-xl text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate max-w-[200px] sm:max-w-md">
                {schoolSetting?.schoolName || 'Government Model Senior Secondary School'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Session 2026-27</span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Today's Date Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-brand-teal" />
              <span>{todayFormatted}</span>
            </div>

            {/* Quick Action: Mark Attendance */}
            <button
              onClick={() => navigate('/attendance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-teal hover:bg-brand-tealDark text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Mark Today's Attendance</span>
              <span className="sm:hidden">Attendance</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="font-bold text-slate-800 text-sm">Notifications</div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-brand-teal hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No recent notifications
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n._id}
                          className={cn(
                            'py-2.5 px-2 rounded-lg transition-colors',
                            !n.isRead ? 'bg-teal-50/50' : 'hover:bg-slate-50'
                          )}
                        >
                          <p className="text-xs font-bold text-slate-800">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

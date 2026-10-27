import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Pages
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AttendancePage } from './pages/AttendancePage.js';
import { MonthlyRegisterPage } from './pages/MonthlyRegisterPage.js';
import { StudentsPage } from './pages/StudentsPage.js';
import { StudentDetailsPage } from './pages/StudentDetailsPage.js';
import { ClassesPage } from './pages/ClassesPage.js';
import { HomeworkPage } from './pages/HomeworkPage.js';
import { ExamsPage } from './pages/ExamsPage.js';
import { AnnouncementsPage } from './pages/AnnouncementsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { ActivityLogsPage } from './pages/ActivityLogsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

// Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading ClassSathi...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes inside Main App Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/register" element={<MonthlyRegisterPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentDetailsPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/homework" element={<HomeworkPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* Admin Only Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-logs"
              element={
                <ProtectedRoute adminOnly>
                  <ActivityLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute adminOnly>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

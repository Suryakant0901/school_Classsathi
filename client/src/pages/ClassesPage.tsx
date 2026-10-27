import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ClassItem } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import {
  GraduationCap,
  Plus,
  Users,
  UserCheck,
  ArrowRightLeft,
  X,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

export const ClassesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('');
  const [sectionsStr, setSectionsStr] = useState('A, B');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ClassItem[] }>('/classes');
      if (res.success) {
        setClasses(res.data);
      }
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const sections = sectionsStr
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      await api.post('/classes', {
        name: className,
        grade,
        sections: sections.length > 0 ? sections : ['A'],
        description,
      });

      setIsCreateOpen(false);
      setClassName('');
      setGrade('');
      setDescription('');
      await fetchClasses();
    } catch (err: any) {
      setError(err.message || 'Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-teal" />
            <span>Classes & Sections Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure academic grades, sections, class teachers, and student enrollments.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setError('');
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        )}
      </div>

      {/* Class Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
          Loading classes and sections...
        </div>
      ) : classes.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-600">No classes registered</p>
          <p className="text-xs text-slate-400 mt-1">Create your first class to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-teal-50 text-brand-teal">
                    Grade {cls.grade}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {cls.status}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-800 mt-3">{cls.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cls.description || 'Standard secondary school curriculum.'}
                </p>

                {/* Sections breakdown */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Sections & Enrolled Students
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cls.sections.map((sec) => (
                      <div
                        key={sec}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                      >
                        <span className="font-extrabold text-slate-700 text-xs">Section {sec}</span>
                        <span className="text-xs font-bold text-brand-teal">
                          {cls.sectionCounts?.[sec] || 0} students
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class Teachers */}
                {cls.sectionTeachers && cls.sectionTeachers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Assigned Class Teachers
                    </span>
                    <div className="space-y-1 text-xs text-slate-600">
                      {cls.sectionTeachers.map((st, i) => (
                        <div key={i} className="flex items-center gap-1.5 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
                          <span>
                            Sec {st.section}: {st.teacherId?.name || 'Unassigned'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">
                  Total Students: {cls.studentCount || 0}
                </span>
                <span className="text-brand-teal font-semibold">Active Session</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">Add New Class</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Class / Standard Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 11"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Grade / Standard Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Sections (comma separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="A, B, C"
                  value={sectionsStr}
                  onChange={(e) => setSectionsStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional class description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-teal hover:bg-brand-tealDark text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

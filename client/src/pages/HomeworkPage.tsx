import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Homework, ClassItem } from '../types/index.js';
import { getTodayISODate } from '../lib/utils.js';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Trash2,
  X,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

export const HomeworkPage: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    section: 'A',
    subject: 'Mathematics',
    assignedDate: getTodayISODate(),
    dueDate: getTodayISODate(),
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [hwRes, clsRes] = await Promise.all([
        api.get<{ success: boolean; data: Homework[] }>('/homework'),
        api.get<{ success: boolean; data: ClassItem[] }>('/classes'),
      ]);

      if (hwRes.success) setHomeworkList(hwRes.data);
      if (clsRes.success) {
        setClasses(clsRes.data);
        if (clsRes.data.length > 0 && !formData.classId) {
          setFormData((prev) => ({ ...prev, classId: clsRes.data[0]._id }));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/homework', formData);
      setIsOpen(false);
      setFormData({
        title: '',
        description: '',
        classId: classes[0]?._id || '',
        section: 'A',
        subject: 'Mathematics',
        assignedDate: getTodayISODate(),
        dueDate: getTodayISODate(),
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create homework assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this homework?')) return;
    try {
      await api.delete(`/homework/${id}`);
      await fetchData();
    } catch {
      alert('Failed to delete homework');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-teal" />
            <span>Classroom Homework & Tasks</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign subject homework, set submission deadlines, and notify students.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setIsOpen(true);
          }}
          className="px-4 py-2 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Homework</span>
        </button>
      </div>

      {/* Homework List Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
          Loading homework assignments...
        </div>
      ) : homeworkList.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-600">No active homework assignments</p>
          <p className="text-xs text-slate-400 mt-1">
            Assign the first homework to keep students on track.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworkList.map((hw) => (
            <div
              key={hw._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-brand-teal">
                    {hw.subject}
                  </span>
                  <button
                    onClick={() => handleDelete(hw._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete homework"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mt-3">{hw.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{hw.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-600">
                  <span>Class: {hw.classId?.name} - {hw.section}</span>
                  <span className="text-brand-teal capitalize font-bold">{hw.status}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {hw.dueDate}
                  </span>
                  <span>By {hw.createdBy?.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Homework Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">Assign New Homework</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Homework Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 5 Questions 1 to 10"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Class *
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Section *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Science, English"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assigned Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.assignedDate}
                    onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instructions / Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write detailed homework instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-teal hover:bg-brand-tealDark text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Assign Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

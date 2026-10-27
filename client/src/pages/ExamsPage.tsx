import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Exam, ClassItem } from '../types/index.js';
import { getTodayISODate } from '../lib/utils.js';
import {
  Award,
  Plus,
  Calendar,
  CheckCircle2,
  X,
  AlertTriangle,
  FolderOpen,
  Edit2,
  Save,
} from 'lucide-react';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Exam Modal
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    examDate: getTodayISODate(),
    classId: '',
    section: 'A',
    subject: 'Mathematics',
    maxMarks: 50,
    passingMarks: 18,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Marks Entry Modal
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [marksRoster, setMarksRoster] = useState<any[]>([]);
  const [isMarksLoading, setIsMarksLoading] = useState(false);
  const [isMarksSaving, setIsMarksSaving] = useState(false);
  const [marksError, setMarksError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [examRes, clsRes] = await Promise.all([
        api.get<{ success: boolean; data: Exam[] }>('/exams'),
        api.get<{ success: boolean; data: ClassItem[] }>('/classes'),
      ]);

      if (examRes.success) setExams(examRes.data);
      if (clsRes.success) {
        setClasses(clsRes.data);
        if (clsRes.data.length > 0 && !formData.classId) {
          setFormData((prev) => ({ ...prev, classId: clsRes.data[0]._id }));
        }
      }
    } catch {
      // error
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
      await api.post('/exams', formData);
      setIsOpen(false);
      setFormData({
        title: '',
        examDate: getTodayISODate(),
        classId: classes[0]?._id || '',
        section: 'A',
        subject: 'Mathematics',
        maxMarks: 50,
        passingMarks: 18,
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMarksEntry = async (exam: Exam) => {
    setSelectedExam(exam);
    setIsMarksLoading(true);
    setMarksError('');

    try {
      const res = await api.get<{
        success: boolean;
        data: { exam: Exam; students: any[] };
      }>(`/exams/${exam._id}/results`);

      if (res.success) {
        setMarksRoster(res.data.students);
      }
    } catch (err: any) {
      setMarksError(err.message || 'Failed to load exam marks roster');
    } finally {
      setIsMarksLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExam) return;
    setIsMarksSaving(true);
    setMarksError('');

    // Client-side validation: check max marks
    for (const r of marksRoster) {
      if (!r.isAbsent && Number(r.marksObtained) > selectedExam.maxMarks) {
        setMarksError(
          `Marks for ${r.fullName} (${r.marksObtained}) cannot exceed Maximum Marks (${selectedExam.maxMarks}).`
        );
        setIsMarksSaving(false);
        return;
      }
    }

    try {
      const resultsToSave = marksRoster.map((r) => ({
        studentId: r.studentId,
        marksObtained: Number(r.marksObtained),
        isAbsent: Boolean(r.isAbsent),
        remarks: r.remarks || '',
      }));

      await api.post('/exams/marks', {
        examId: selectedExam._id,
        results: resultsToSave,
      });

      alert('Exam marks saved successfully!');
      setSelectedExam(null);
      await fetchData();
    } catch (err: any) {
      setMarksError(err.message || 'Failed to save marks.');
    } finally {
      setIsMarksSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-teal" />
            <span>Exams, Class Tests & Marks</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule tests, enter subject marks, record absences, and track student grades.
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
          <span>Schedule Exam</span>
        </button>
      </div>

      {/* Exam Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
          Loading exams...
        </div>
      ) : exams.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-600">No exams scheduled yet</p>
          <p className="text-xs text-slate-400 mt-1">Schedule your first unit test or periodic test.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((ex) => (
            <div
              key={ex._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-brand-teal">
                    {ex.subject}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                      ex.status === 'graded'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ex.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mt-3">{ex.title}</h3>
                <div className="text-xs text-slate-500 font-semibold mt-1">
                  Class: {ex.classId?.name} - {ex.section}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">
                      Max Marks
                    </span>
                    <span className="text-slate-800 font-bold">{ex.maxMarks}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">
                      Passing Marks
                    </span>
                    <span className="text-slate-800 font-bold">{ex.passingMarks}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{ex.examDate}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenMarksEntry(ex)}
                  className="px-3 py-1.5 bg-brand-navy hover:bg-brand-navyLight text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{ex.status === 'graded' ? 'Edit Marks' : 'Enter Marks'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Exam Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">Schedule Class Test</h3>
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
                  Exam / Test Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test 2 - Mathematics"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
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
                  placeholder="e.g. Mathematics, Science"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Exam Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Max Marks *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.maxMarks}
                    onChange={(e) =>
                      setFormData({ ...formData, maxMarks: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.passingMarks}
                    onChange={(e) =>
                      setFormData({ ...formData, passingMarks: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center"
                  />
                </div>
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
                  {isSubmitting ? 'Scheduling...' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marks Entry Sheet Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">
                  Enter Marks: {selectedExam.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Subject: {selectedExam.subject} • Max Marks: {selectedExam.maxMarks} • Passing:{' '}
                  {selectedExam.passingMarks}
                </p>
              </div>
              <button onClick={() => setSelectedExam(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {marksError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{marksError}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto my-4 border border-slate-200 rounded-2xl">
              {isMarksLoading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Loading class student marks roster...
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500">
                    <tr>
                      <th className="p-3 w-12 text-center">Roll</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3 w-32 text-center">Marks Obtained</th>
                      <th className="p-3 w-28 text-center">Absent?</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksRoster.map((stu, idx) => (
                      <tr key={stu.studentId} className="hover:bg-slate-50">
                        <td className="p-3 text-center font-extrabold text-slate-700">
                          {stu.rollNumber}
                        </td>
                        <td className="p-3 font-bold text-slate-800">{stu.fullName}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={selectedExam.maxMarks}
                            disabled={stu.isAbsent}
                            value={stu.isAbsent ? 0 : stu.marksObtained}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              setMarksRoster((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, marksObtained: val } : s
                                )
                              );
                            }}
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-800 disabled:opacity-30 focus:ring-1 focus:ring-brand-teal"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(stu.isAbsent)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setMarksRoster((prev) =>
                                  prev.map((s, i) =>
                                    i === idx
                                      ? {
                                          ...s,
                                          isAbsent: checked,
                                          marksObtained: checked ? 0 : s.marksObtained,
                                        }
                                      : s
                                  )
                                );
                              }}
                              className="rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span className="text-[11px] font-semibold text-rose-600">Absent</span>
                          </label>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={stu.remarks || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMarksRoster((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, remarks: val } : s))
                              );
                            }}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedExam(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMarksSaving}
                onClick={handleSaveMarks}
                className="px-5 py-2 bg-brand-teal hover:bg-brand-tealDark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isMarksSaving ? 'Saving Marks...' : 'Save All Marks'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

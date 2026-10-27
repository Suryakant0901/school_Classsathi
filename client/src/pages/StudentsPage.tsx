import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Student, ClassItem } from '../types/index.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import {
  Users,
  Search,
  UserPlus,
  Upload,
  Download,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [status, setStatus] = useState('active');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [studentToToggle, setStudentToToggle] = useState<Student | null>(null);

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    fullName: '',
    admissionNumber: '',
    rollNumber: '',
    classId: '',
    section: 'A',
    gender: 'Male',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importClassId, setImportClassId] = useState('');
  const [importSection, setImportSection] = useState('A');
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await api.get<{ success: boolean; data: ClassItem[] }>('/classes');
      if (res.success) {
        setClasses(res.data);
        if (res.data.length > 0 && !formData.classId) {
          setFormData((prev) => ({ ...prev, classId: res.data[0]._id }));
          setImportClassId(res.data[0]._id);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        status,
      });

      if (search) params.append('search', search);
      if (selectedClassId) params.append('classId', selectedClassId);
      if (selectedSection) params.append('section', selectedSection);

      const res = await api.get<{
        success: boolean;
        data: Student[];
        pagination: { total: number; totalPages: number };
      }>(`/students?${params.toString()}`);

      if (res.success) {
        setStudents(res.data);
        setTotalStudents(res.data.length > 0 ? res.pagination.total : 0);
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, search, selectedClassId, selectedSection, status]);

  const handleOpenAdd = () => {
    setEditStudent(null);
    setFormError('');
    setFormData({
      fullName: '',
      admissionNumber: '',
      rollNumber: '',
      classId: classes[0]?._id || '',
      section: 'A',
      gender: 'Male',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      address: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (stu: Student) => {
    setEditStudent(stu);
    setFormError('');
    setFormData({
      fullName: stu.fullName,
      admissionNumber: stu.admissionNumber,
      rollNumber: stu.rollNumber,
      classId: stu.classId?._id || classes[0]?._id || '',
      section: stu.section,
      gender: stu.gender || 'Male',
      guardianName: stu.guardianName,
      guardianPhone: stu.guardianPhone,
      guardianEmail: stu.guardianEmail || '',
      address: stu.address || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editStudent) {
        await api.put(`/students/${editStudent._id}`, formData);
      } else {
        await api.post('/students', formData);
      }
      setIsAddModalOpen(false);
      await fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save student record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!studentToToggle) return;
    const nextStatus = studentToToggle.status === 'active' ? 'inactive' : 'active';

    try {
      await api.patch(`/students/${studentToToggle._id}/status`, { status: nextStatus });
      setStudentToToggle(null);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to change student status');
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (selectedClassId) params.append('classId', selectedClassId);
    if (selectedSection) params.append('section', selectedSection);
    if (status) params.append('status', status);

    window.open(`/api/v1/students/export?${params.toString()}`, '_blank');
  };

  // CSV Import Parsing & Dry Run
  const handlePreviewCSV = async () => {
    if (!csvText.trim()) {
      alert('Please enter or paste CSV content.');
      return;
    }

    setIsImporting(true);
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        alert('CSV must contain a header line and at least one student row.');
        setIsImporting(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        return rowObj;
      });

      const res = await api.post<{ success: boolean; data: any }>('/students/import', {
        classId: importClassId,
        section: importSection,
        rows,
        isCommit: false, // dry-run preview!
      });

      setImportPreview(res);
    } catch (err: any) {
      alert(err.message || 'Failed to parse CSV');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCommitCSV = async () => {
    if (!importPreview || importPreview.validCount === 0) return;
    setIsImporting(true);

    try {
      const res = await api.post<{ success: boolean; validCount: number }>('/students/import', {
        classId: importClassId,
        section: importSection,
        rows: importPreview.validRows,
        isCommit: true,
      });

      if (res.success) {
        alert(`Successfully imported ${importPreview.validCount} students!`);
        setIsImportModalOpen(false);
        setImportPreview(null);
        setCsvText('');
        await fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Error committing import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-teal" />
            <span>Student Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student profiles, rolls, parent contacts, and admission records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, roll #, admission #, or guardian..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
          />
        </div>

        {/* Class Filter */}
        <select
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal"
        >
          <option value="active">Active Enrolled</option>
          <option value="inactive">Deactivated</option>
          <option value="all">All Records</option>
        </select>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Loading students directory...
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-600">No students found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first student or adjust search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-16">Roll</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class & Sec</th>
                  <th className="py-3.5 px-4">Admission No</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Guardian Info</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
                  <tr key={stu._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Roll */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 font-extrabold text-slate-700 text-xs">
                        {stu.rollNumber}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => navigate(`/students/${stu._id}`)}
                        className="font-bold text-slate-800 hover:text-brand-teal transition-colors text-left"
                      >
                        {stu.fullName}
                      </button>
                      <div className="text-[11px] text-slate-400">{stu.gender}</div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                      {stu.classId?.name} - {stu.section}
                    </td>

                    {/* Admission */}
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {stu.admissionNumber}
                    </td>

                    {/* Guardian */}
                    <td className="py-3.5 px-4 hidden md:table-cell text-xs">
                      <div className="font-semibold text-slate-700">{stu.guardianName}</div>
                      <div className="text-slate-400">{stu.guardianPhone}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          stu.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/students/${stu._id}`)}
                          className="p-1.5 text-slate-400 hover:text-brand-teal hover:bg-teal-50 rounded-lg transition-colors"
                          title="View Attendance History"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(stu)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setStudentToToggle(stu)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            stu.status === 'active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={stu.status === 'active' ? 'Deactivate Student' : 'Restore Student'}
                        >
                          {stu.status === 'active' ? (
                            <Trash2 className="w-4 h-4" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {students.length} of {totalStudents} students
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800">
                {editStudent ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Admission Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADM-2026-1050"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Class *
                  </label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  >
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Section *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="A"
                      value={formData.section}
                      onChange={(e) =>
                        setFormData({ ...formData, section: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase text-center focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Roll No *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Father / Mother Name"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Guardian Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Guardian Email
                  </label>
                  <input
                    type="email"
                    placeholder="Optional email"
                    value={formData.guardianEmail}
                    onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional address details..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-teal hover:bg-brand-tealDark text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-teal" />
                <span>Import Students via CSV</span>
              </h3>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreview(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Target Class
                  </label>
                  <select
                    value={importClassId}
                    onChange={(e) => setImportClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Target Section
                  </label>
                  <input
                    type="text"
                    value={importSection}
                    onChange={(e) => setImportSection(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-center"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-600">
                    Paste CSV Data
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(
                        `admissionNumber,rollNumber,fullName,gender,guardianName,guardianPhone\nADM-2026-2001,1,Manav Sharma,Male,Ramesh Sharma,9871100050\nADM-2026-2002,2,Kritika Roy,Female,Alok Roy,9871100051`
                      );
                    }}
                    className="text-[11px] text-brand-teal font-semibold hover:underline"
                  >
                    Insert Example CSV
                  </button>
                </div>
                <textarea
                  rows={6}
                  placeholder="admissionNumber,rollNumber,fullName,gender,guardianName,guardianPhone&#10;ADM-2026-1030,26,Simran Kaur,Female,Harpreet Singh,9871100026"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              {/* Preview Results */}
              {importPreview && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-emerald-700">
                      ✅ Valid Rows: {importPreview.validCount}
                    </span>
                    <span className="text-rose-700">
                      ❌ Invalid Rows: {importPreview.invalidCount}
                    </span>
                  </div>

                  {importPreview.invalidRows.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-rose-600">
                      {importPreview.invalidRows.map((inv: any, idx: number) => (
                        <div key={idx} className="bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                          Row {inv.row}: {inv.errors.join('; ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                {!importPreview ? (
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handlePreviewCSV}
                    className="px-4 py-2 bg-brand-navy hover:bg-brand-navyLight text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {isImporting ? 'Validating...' : 'Validate CSV Rows'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isImporting || importPreview.validCount === 0}
                    onClick={handleCommitCSV}
                    className="px-5 py-2 bg-brand-teal hover:bg-brand-tealDark text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : `Import ${importPreview.validCount} Students`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate / Restore Confirmation */}
      <ConfirmModal
        isOpen={Boolean(studentToToggle)}
        title={
          studentToToggle?.status === 'active'
            ? `Deactivate ${studentToToggle?.fullName}?`
            : `Restore ${studentToToggle?.fullName}?`
        }
        message={
          studentToToggle?.status === 'active'
            ? 'Deactivating will archive this student from daily rosters while safely retaining their historical attendance records and marks.'
            : 'Restoring will re-enable this student on active classroom rosters.'
        }
        confirmText={studentToToggle?.status === 'active' ? 'Deactivate Student' : 'Restore Student'}
        isDestructive={studentToToggle?.status === 'active'}
        onConfirm={handleToggleStatus}
        onCancel={() => setStudentToToggle(null)}
      />
    </div>
  );
};

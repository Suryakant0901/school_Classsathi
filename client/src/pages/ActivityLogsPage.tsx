import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { AuditLog } from '../types/index.js';
import { History, Shield, Filter, Search } from 'lucide-react';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: AuditLog[] }>(
        `/audit-logs${filterAction ? `?action=${filterAction}` : ''}`
      );
      if (res.success) setLogs(res.data);
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-brand-teal" />
            <span>Audit & Activity Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-proof record of logins, attendance submissions, and student record modifications.
          </p>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
        >
          <option value="">All Actions</option>
          <option value="AUTH_LOGIN">Logins</option>
          <option value="ATTENDANCE_SUBMIT">Attendance Submissions</option>
          <option value="ATTENDANCE_CORRECTION">Attendance Corrections</option>
          <option value="STUDENT_CREATE">Student Creations</option>
          <option value="STUDENT_TRANSFER">Student Transfers</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Staff Actor</th>
                  <th className="p-3.5">Entity Type</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold px-2 py-0.5 rounded-lg bg-teal-50 text-brand-teal text-[10px] uppercase tracking-wider">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {l.actorName}
                      <span className="text-slate-400 font-normal block text-[10px]">
                        {l.actorRole}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{l.entityType}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {l.details ? JSON.stringify(l.details) : '-'}
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">
                      {l.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

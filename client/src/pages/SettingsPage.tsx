import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { SchoolSetting } from '../types/index.js';
import { Settings, Save, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Partial<SchoolSetting>>({
    schoolName: '',
    tagline: '',
    principalName: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'Asia/Kolkata',
    defaultAttendanceThreshold: 75,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<{ success: boolean; data: SchoolSetting }>('/settings');
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch {
        // error
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await api.put<{ success: boolean; data: SchoolSetting }>('/settings', settings);
      if (res.success) {
        setMessage({ text: 'School settings updated successfully!', type: 'success' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update settings', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-teal" />
            <span>School Profile & System Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage school identity, attendance alert thresholds, and operational timezone.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Branding Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 border-b pb-3 border-slate-100">
            Institution Details & Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Official School Name *
              </label>
              <input
                type="text"
                required
                value={settings.schoolName || ''}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Motto / Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Principal / Headmaster Name
              </label>
              <input
                type="text"
                value={settings.principalName || ''}
                onChange={(e) => setSettings({ ...settings, principalName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                School Campus Address
              </label>
              <textarea
                rows={2}
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>
        </div>

        {/* Attendance Rules & Calculation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 border-b pb-3 border-slate-100">
            Attendance Rules & Calculations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Low Attendance Alert Threshold (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={100}
                  required
                  value={settings.defaultAttendanceThreshold || 75}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultAttendanceThreshold: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
                <span className="text-xs text-slate-500 font-semibold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Students below this percentage are flagged for attention.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                School Timezone
              </label>
              <input
                type="text"
                readOnly
                value={settings.timezone || 'Asia/Kolkata'}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-700 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Standard Indian Time (IST) ensures consistent school date boundaries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-brand-teal hover:bg-brand-tealDark text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-teal/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React from 'react';
import { AttendanceStatusType } from '../../types/index.js';
import { CheckCircle2, XCircle, Clock, CalendarDays, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface Props {
  status?: AttendanceStatusType | string | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AttendanceStatusBadge: React.FC<Props> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        Unmarked
      </span>
    );
  }

  const s = status.toLowerCase();

  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    present: {
      label: 'Present',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    absent: {
      label: 'Absent',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: XCircle,
    },
    late: {
      label: 'Late',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
    },
    leave: {
      label: 'Leave',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: CalendarDays,
    },
    half_day: {
      label: 'Half Day',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: AlertCircle,
    },
  };

  const config = configs[s] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: CheckCircle2,
  };

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-semibold px-3 py-1.5',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors',
        config.bg,
        sizeClasses
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
};

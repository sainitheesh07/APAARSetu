import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase().trim();

  let styles = 'bg-slate-100 text-slate-700 border-slate-300';

  if (['APPROVED', 'VERIFIED', 'COMPLETED', 'RESOLVED', 'ACTIVE', 'SUCCESS'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  } else if (['PENDING', 'PENDING_REVIEW', 'PENDING_INSPECTION', 'VALIDATING', 'UPLOADED'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-300';
  } else if (['REJECTED', 'SUSPENDED', 'FLAGGED', 'CRITICAL', 'FAILED', 'FAILURE', 'NOT_VERIFIED'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-300';
  } else if (['WARNING', 'EXCEPTION_APPROVED'].includes(norm)) {
    styles = 'bg-orange-50 text-orange-700 border-orange-300';
  } else if (['INFO', 'ENROLLED'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-300';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center rounded-full border ${padding} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

'use client';

import { QUESTION_TYPES } from '@/utils/constants';

export default function Badge({ type, children, className = '' }) {
  if (type && QUESTION_TYPES[type]) {
    const config = QUESTION_TYPES[type];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${config.color} ${className}`}>
        {config.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-surface-700/50 text-surface-300 border border-surface-600/40 ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    'in_progress': 'bg-warning/10 text-warning border-warning/20',
    'completed': 'bg-success/10 text-success border-success/20',
    'idle': 'bg-surface-700/50 text-surface-400 border-surface-600/40',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${styles[status] || styles.idle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'in_progress' ? 'bg-warning animate-pulse' :
        status === 'completed' ? 'bg-success' : 'bg-surface-500'
      }`} />
      {status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Idle'}
    </span>
  );
}

import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    DRAFT: {
      label: 'Draft',
      className: 'bg-slate-800/80 text-slate-300 border-slate-700',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    IN_REVIEW: {
      label: 'In Review',
      className: 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse',
    },
    CHANGES_REQUESTED: {
      label: 'Changes Requested',
      className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    },
    APPROVED: {
      label: 'Approved',
      className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-glow-emerald',
    },
    COMPLETED: {
      label: 'Completed',
      className: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    },
  };

  const current = map[status] || {
    label: status,
    className: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    LOW: {
      label: 'Low Priority',
      className: 'bg-slate-800 text-slate-400 border-slate-700',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    },
    HIGH: {
      label: 'High Priority',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    URGENT: {
      label: 'Urgent',
      className: 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse',
    },
  };

  const current = map[priority] || {
    label: priority,
    className: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${current.className}`}
    >
      {current.label}
    </span>
  );
}

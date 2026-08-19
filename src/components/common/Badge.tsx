import React from 'react';
import { ParticipantStatus, MatchStatus } from '../../types/participant';

interface StatusBadgeProps {
  status: ParticipantStatus | MatchStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = status;

  switch (status) {
    case 'SENT':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      label = 'SENT';
      break;
    case 'PENDING':
      colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      label = 'PENDING';
      break;
    case 'SENDING':
      colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse';
      label = 'SENDING';
      break;
    case 'FAILED':
      colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      label = 'FAILED';
      break;
    case 'SKIPPED':
      colorClasses = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      label = 'SKIPPED';
      break;
    case 'INVALID':
      colorClasses = 'bg-rose-900/20 text-rose-300 border-rose-800/50';
      label = 'INVALID EMAIL';
      break;
    case 'NO_CERTIFICATE':
      colorClasses = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      label = 'NO CERTIFICATE';
      break;
    case 'MATCHED':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      label = 'MATCHED';
      break;
    case 'NOT_FOUND':
      colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      label = 'NOT FOUND';
      break;
    case 'DUPLICATE':
      colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      label = 'DUPLICATE';
      break;
    case 'MISSING_ID':
      colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      label = 'MISSING ID';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center tracking-wider rounded-md border ${sizeClass} ${colorClasses}`}
    >
      {label}
    </span>
  );
};

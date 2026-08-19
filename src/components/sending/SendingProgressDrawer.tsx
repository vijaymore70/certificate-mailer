import React from 'react';
import { SendingProgress } from '../../services/sendingEngine';
import { Play, Pause, XCircle, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

interface SendingProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  progress: SendingProgress;
  onPause: () => void;
  onResume: () => void;
}

export const SendingProgressDrawer: React.FC<SendingProgressDrawerProps> = ({
  isOpen,
  onClose,
  progress,
  onPause,
  onResume,
}) => {
  if (!isOpen) return null;

  const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-800 p-6 shadow-2xl backdrop-blur-xl">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Drawer Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${progress.isSending ? 'bg-cyan-400 animate-ping' : progress.isQuotaExhausted ? 'bg-amber-400' : 'bg-slate-500'}`} />
            <h3 className="text-base font-semibold text-slate-100">
              Bulk Certificate Email Execution
            </h3>
            {progress.isQuotaExhausted && (
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-2.5 py-0.5 rounded-md font-semibold">
                QUOTA PAUSED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {progress.isSending ? (
              <button
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg transition-all flex items-center gap-2"
              >
                <Pause className="h-4 w-4" /> Pause Queue
              </button>
            ) : progress.isPaused || progress.isQuotaExhausted ? (
              <button
                onClick={onResume}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg transition-all flex items-center gap-2"
              >
                <Play className="h-4 w-4" /> Resume Sending
              </button>
            ) : null}

            <button
              onClick={onClose}
              disabled={progress.isSending}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-xl transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quota Exhaustion Alert Box */}
        {progress.isQuotaExhausted && (
          <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl flex items-start gap-3 text-amber-200 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Daily Email Quota Exhausted!</p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Google Apps Script daily email sending limit reached (0 remaining). Remaining pending certificates are safely preserved and ready for continuation in the next daily sending window.
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Overall Progress: {progress.processed} / {progress.total} recipients</span>
            <span className="text-cyan-400">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Processed</span>
            <p className="text-lg font-bold text-slate-100">{progress.processed} / {progress.total}</p>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Sent</span>
            <p className="text-lg font-bold text-emerald-400">{progress.sentCount}</p>
          </div>

          <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl">
            <span className="text-[10px] text-rose-400 uppercase font-semibold">Failed</span>
            <p className="text-lg font-bold text-rose-400">{progress.failedCount}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Skipped</span>
            <p className="text-lg font-bold text-slate-300">{progress.skippedCount}</p>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/40 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-semibold">Quota Remaining</span>
              <p className="text-lg font-bold text-amber-300">{progress.remainingQuota}</p>
            </div>
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        {/* Current status message */}
        {progress.message && (
          <p className="text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 truncate">
            {progress.message}
          </p>
        )}
      </div>
    </div>
  );
};

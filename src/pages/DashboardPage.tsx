import React, { useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { StatusBadge } from '../components/common/Badge';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Play,
  FileSpreadsheet,
  FileText,
  Mail,
  Award,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { TabType } from '../components/layout/Sidebar';
import { SendingEngine, SendingProgress } from '../services/sendingEngine';
import { SendingProgressDrawer } from '../components/sending/SendingProgressDrawer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface DashboardPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { activeEvent, stats, participants, certificates, gasSettings, refreshData, showToast } =
    useEventContext();

  const [isSendingDrawerOpen, setIsSendingDrawerOpen] = useState(false);
  const [sendingProgress, setSendingProgress] = useState<SendingProgress>({
    total: 0,
    processed: 0,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    remainingQuota: gasSettings.remainingQuota,
    isSending: false,
    isPaused: false,
    isQuotaExhausted: false,
  });
  const [isConfirmSendOpen, setIsConfirmSendOpen] = useState(false);

  const pendingCount = stats.pendingCount;
  const progressPercent =
    stats.totalParticipants > 0
      ? Math.round((stats.sentCount / stats.totalParticipants) * 100)
      : 0;

  const handleStartSending = async () => {
    if (!activeEvent) return;
    const engine = SendingEngine.getInstance();
    setIsSendingDrawerOpen(true);

    await engine.startSending(
      activeEvent.id,
      activeEvent.name,
      activeEvent.emailTemplate,
      (progress) => {
        setSendingProgress(progress);
        refreshData();
      }
    );
  };

  const handlePauseSending = () => {
    SendingEngine.getInstance().pause();
  };

  const handleResumeSending = async () => {
    if (!activeEvent) return;
    setIsSendingDrawerOpen(true);
    await SendingEngine.getInstance().startSending(
      activeEvent.id,
      activeEvent.name,
      activeEvent.emailTemplate,
      (progress) => {
        setSendingProgress(progress);
        refreshData();
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" /> Event: {activeEvent?.name}
            </span>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Certificate Email Automation Center
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Match Excel/CSV participant records with PDF certificates, preview personalized email templates, and safely execute bulk dispatches respecting Gmail daily quotas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {pendingCount > 0 ? (
              <button
                onClick={() => setIsConfirmSendOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Play className="h-4 w-4 fill-white" /> Start Bulk Sending ({pendingCount})
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('generator')}
                className="px-6 py-3 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                <Wand2 className="h-4 w-4 text-cyan-400" /> Certificate Generator
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-200">Overall Certificate Delivery Progress</span>
          <span className="font-mono font-bold text-cyan-400">{progressPercent}% Completed</span>
        </div>
        <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 pt-1">
          <span>{stats.sentCount} sent of {stats.totalParticipants} total</span>
          <span>{stats.pendingCount} pending in queue</span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Records</span>
            <Users className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.totalParticipants}</p>
          <span className="text-[11px] text-slate-500">Spreadsheet imported rows</span>
        </div>

        {/* Matched */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Matched PDFs</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.matchedCertificates}</p>
          <span className="text-[11px] text-slate-500">{certificates.length} PDF files uploaded</span>
        </div>

        {/* Sent */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Sent Emails</span>
            <Mail className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{stats.sentCount}</p>
          <span className="text-[11px] text-slate-500">Delivered certificates</span>
        </div>

        {/* Quota */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Daily Quota</span>
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300">{gasSettings.remainingQuota}</p>
          <span className="text-[11px] text-slate-500">Gmail daily quota left</span>
        </div>
      </div>

      {/* Secondary Status Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400 uppercase font-semibold">Pending</span>
            <p className="text-lg font-bold text-slate-200">{stats.pendingCount}</p>
          </div>
          <Clock className="h-5 w-5 text-amber-400/60" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-rose-400 uppercase font-semibold">Failed</span>
            <p className="text-lg font-bold text-slate-200">{stats.failedCount}</p>
          </div>
          <AlertCircle className="h-5 w-5 text-rose-400/60" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-orange-400 uppercase font-semibold">No Certificate</span>
            <p className="text-lg font-bold text-slate-200">{stats.noCertCount}</p>
          </div>
          <FileText className="h-5 w-5 text-orange-400/60" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Invalid Email</span>
            <p className="text-lg font-bold text-slate-200">{stats.invalidCount}</p>
          </div>
          <AlertCircle className="h-5 w-5 text-slate-500" />
        </div>
      </div>



      {/* Confirmation Dialog before sending */}
      <ConfirmDialog
        isOpen={isConfirmSendOpen}
        onClose={() => setIsConfirmSendOpen(false)}
        onConfirm={handleStartSending}
        title="Confirm Bulk Certificate Email Sending"
        message={`You are about to send personalized PDF certificates to ${pendingCount} pending participants. Please make sure you have sent a test email first.`}
        confirmLabel={`Start Sending (${pendingCount})`}
        variant="info"
      />

      {/* Live Sending Drawer */}
      <SendingProgressDrawer
        isOpen={isSendingDrawerOpen}
        onClose={() => setIsSendingDrawerOpen(false)}
        progress={sendingProgress}
        onPause={handlePauseSending}
        onResume={handleResumeSending}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { ParticipantTable } from '../components/participants/ParticipantTable';
import { SendingProgressDrawer } from '../components/sending/SendingProgressDrawer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SendingEngine, SendingProgress } from '../services/sendingEngine';
import { Play, RotateCcw } from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const { activeEvent, stats, refreshData, gasSettings } = useEventContext();

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
  const [retryOnlyFailed, setRetryOnlyFailed] = useState(false);

  const pendingCount = stats.pendingCount;
  const failedCount = stats.failedCount;

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
      },
      { retryOnlyFailed }
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

  const triggerBulkSend = () => {
    setRetryOnlyFailed(false);
    setIsConfirmSendOpen(true);
  };

  const triggerRetryFailed = () => {
    setRetryOnlyFailed(true);
    setIsConfirmSendOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Participant Roster & Dispatch Queue</h2>
          <p className="text-xs text-slate-400">
            View participant list, search records, reset statuses, and execute bulk certificate sending.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {failedCount > 0 && (
            <button
              onClick={triggerRetryFailed}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-900/30 transition-all flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Retry Failed Emails ({failedCount})
            </button>
          )}

          <button
            onClick={triggerBulkSend}
            disabled={pendingCount === 0}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            <Play className="h-4 w-4 fill-white" /> Start Bulk Sending ({pendingCount})
          </button>
        </div>
      </div>

      {/* Participant Table */}
      <ParticipantTable
        onStartBulkSending={triggerBulkSend}
        onRetryFailedSending={triggerRetryFailed}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmSendOpen}
        onClose={() => setIsConfirmSendOpen(false)}
        onConfirm={handleStartSending}
        title={retryOnlyFailed ? 'Confirm Retry Failed Emails' : 'Confirm Bulk Certificate Email Sending'}
        message={
          retryOnlyFailed
            ? `You are about to retry sending certificate emails to ${failedCount} failed records.`
            : `You are about to send personalized PDF certificates to ${pendingCount} pending participants.`
        }
        confirmLabel={
          retryOnlyFailed ? `Retry Failed (${failedCount})` : `Start Sending (${pendingCount})`
        }
        variant={retryOnlyFailed ? 'warning' : 'info'}
      />

      {/* Sending Progress Drawer */}
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

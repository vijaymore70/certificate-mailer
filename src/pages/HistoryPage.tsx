import React, { useEffect, useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { getLogsByEvent } from '../services/db';
import { SendingLogEntry } from '../types/api';
import { exportLogsToCSV } from '../utils/exportCsv';
import { Download, History, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';

export const HistoryPage: React.FC = () => {
  const { activeEvent } = useEventContext();
  const [logs, setLogs] = useState<SendingLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!activeEvent) return;
    setLoading(true);
    try {
      const data = await getLogsByEvent(activeEvent.id);
      // Sort newest first
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeEvent]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Sending History & Audit Logs</h2>
          <p className="text-xs text-slate-400">
            Complete audit trail of all certificate email dispatches, timestamp records, and failure diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4 text-cyan-400" /> Refresh Audit Trail
          </button>

          <button
            onClick={() => exportLogsToCSV(logs, `${activeEvent?.name || 'Event'}_sending_history.csv`)}
            disabled={logs.length === 0}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export History to CSV
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3.5 pl-5">Timestamp</th>
              <th className="p-3.5">Participant Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Certificate ID</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Attempt</th>
              <th className="p-3.5 pr-5">Error Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                  No sending logs recorded for this event yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 pl-5 text-xs font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-100">{log.participantName}</td>
                  <td className="p-3.5 text-xs text-slate-300">{log.email}</td>
                  <td className="p-3.5 text-xs font-mono text-cyan-400">{log.certificateId}</td>
                  <td className="p-3.5">
                    <StatusBadge status={log.status} size="sm" />
                  </td>
                  <td className="p-3.5 text-xs font-mono text-slate-400">{log.attemptNumber}</td>
                  <td className="p-3.5 pr-5 text-xs text-rose-400 max-w-[200px] truncate" title={log.errorMessage}>
                    {log.errorMessage || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

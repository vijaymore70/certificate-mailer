import React, { useState, useMemo } from 'react';
import { useEventContext } from '../../context/EventContext';
import { Participant, ParticipantStatus } from '../../types/participant';
import { StatusBadge } from '../common/Badge';
import {
  Search,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  Send,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { EditParticipantModal } from './EditParticipantModal';
import { CertPreviewModal } from '../certificates/CertPreviewModal';
import { CertificateFile } from '../../types/certificate';
import { GasService } from '../../services/gasService';

interface ParticipantTableProps {
  onStartBulkSending?: () => void;
  onRetryFailedSending?: () => void;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  onStartBulkSending,
  onRetryFailedSending,
}) => {
  const {
    participants,
    certificates,
    deleteParticipantItem,
    resetParticipantStatus,
    showToast,
    activeEvent,
  } = useEventContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [previewCert, setPreviewCert] = useState<CertificateFile | null>(null);
  const [singleSendingId, setSingleSendingId] = useState<string | null>(null);

  const pageSize = 15;
  const certMap = new Map(certificates.map((c) => [c.id, c]));

  // Filtered List
  const filtered = useMemo(() => {
    return participants.filter((p) => {
      // Search
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.certificateId.toLowerCase().includes(query);

      // Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = p.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [participants, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleSingleSend = async (p: Participant) => {
    const cert = p.matchedCertificateId ? certMap.get(p.matchedCertificateId) : null;
    if (!cert) {
      showToast(`Cannot send: No certificate PDF assigned to ${p.name}`, 'error');
      return;
    }

    setSingleSendingId(p.id);
    try {
      let pdfBase64 = cert.base64Data;
      const res = await GasService.sendSingleEmail({
        eventId: p.eventId,
        participantId: p.id,
        name: p.name,
        email: p.email,
        certificateId: p.certificateId,
        eventName: activeEvent?.name || 'Event',
        subject: activeEvent?.emailTemplate.subject || 'Your Certificate',
        bodyHtml: activeEvent?.emailTemplate.bodyHtml || 'Dear {{name}}, find your certificate attached.',
        fromName: activeEvent?.emailTemplate.fromName || 'Certificate Mailer',
        pdfBase64,
        pdfFilename: cert.filename,
      });

      if (res.success) {
        showToast(`Certificate email sent to ${p.email}!`, 'success');
      } else {
        showToast(res.message || 'Failed to send single email.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing single send.', 'error');
    } finally {
      setSingleSendingId(null);
    }
  };

  const statusTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'SENT', label: 'Sent' },
    { id: 'FAILED', label: 'Failed' },
    { id: 'INVALID', label: 'Invalid' },
    { id: 'NO_CERTIFICATE', label: 'No Certificate' },
  ];

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, or certificate ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3.5 pl-5">#</th>
              <th className="p-3.5">Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Certificate ID</th>
              <th className="p-3.5">PDF File</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Attempts</th>
              <th className="p-3.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 text-sm">
                  No participants matching current search or filters.
                </td>
              </tr>
            ) : (
              paginated.map((p, idx) => {
                const cert = p.matchedCertificateId ? certMap.get(p.matchedCertificateId) : null;
                const rowNum = (currentPage - 1) * pageSize + idx + 1;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-5 text-xs text-slate-500">{rowNum}</td>
                    <td className="p-3.5 font-semibold text-slate-100">{p.name}</td>
                    <td className="p-3.5 text-xs text-slate-300">{p.email}</td>
                    <td className="p-3.5 text-xs font-mono text-cyan-400">{p.certificateId}</td>
                    <td className="p-3.5 text-xs">
                      {cert ? (
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                          <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{cert.filename}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={p.status} size="sm" />
                      {p.lastError && (
                        <div className="text-[10px] text-rose-400 max-w-[150px] truncate mt-0.5" title={p.lastError}>
                          {p.lastError}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-xs text-slate-400 font-mono">{p.attempts}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {cert && (
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            title="Preview PDF"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleSingleSend(p)}
                          disabled={singleSendingId === p.id || !cert}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                          title="Send Email Now"
                        >
                          <Send className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => resetParticipantStatus(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="Reset Status to PENDING"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setEditingParticipant(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Edit Details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteParticipantItem(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Remove Participant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
        <span>
          Showing {paginated.length} of {filtered.length} records
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <EditParticipantModal
        isOpen={!!editingParticipant}
        onClose={() => setEditingParticipant(null)}
        participant={editingParticipant}
      />

      {/* Cert Preview Modal */}
      <CertPreviewModal
        isOpen={!!previewCert}
        onClose={() => setPreviewCert(null)}
        certFile={previewCert}
      />
    </div>
  );
};

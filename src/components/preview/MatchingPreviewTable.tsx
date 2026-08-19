import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { StatusBadge } from '../common/Badge';
import { CertificateFile } from '../../types/certificate';
import { CheckCircle2, Edit2, Eye, RefreshCw, FileText } from 'lucide-react';
import { CertPreviewModal } from '../certificates/CertPreviewModal';

export const MatchingPreviewTable: React.FC = () => {
  const {
    participants,
    certificates,
    runMatching,
    manualAssignCertificate,
    activeEvent,
  } = useEventContext();

  const [selectedCertToPreview, setSelectedCertToPreview] = useState<CertificateFile | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [selectedOverrideCertId, setSelectedOverrideCertId] = useState<string>('');

  const certMap = new Map(certificates.map((c) => [c.id, c]));

  const handleOpenEdit = (participantId: string, currentCertId?: string) => {
    setEditingParticipantId(participantId);
    setSelectedOverrideCertId(currentCertId || '');
  };

  const handleSaveOverride = async (participantId: string) => {
    await manualAssignCertificate(participantId, selectedOverrideCertId);
    setEditingParticipantId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Certificate Matching Verification</h3>
          <p className="text-xs text-slate-400">
            Current Strategy: <span className="font-semibold text-cyan-400">{activeEvent?.matchingStrategy || 'CERTIFICATE_ID'}</span>
          </p>
        </div>

        <button
          onClick={() => runMatching()}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Re-Run Auto-Matching
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3.5 pl-5">#</th>
              <th className="p-3.5">Participant Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Certificate ID</th>
              <th className="p-3.5">Matched PDF File</th>
              <th className="p-3.5">Match Status</th>
              <th className="p-3.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {participants.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                  No participants imported yet. Import a CSV/XLSX file to preview matching.
                </td>
              </tr>
            ) : (
              participants.map((p, idx) => {
                const matchedCert = p.matchedCertificateId ? certMap.get(p.matchedCertificateId) : null;
                const isEditing = editingParticipantId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-5 text-xs text-slate-500">{idx + 1}</td>
                    <td className="p-3.5 font-semibold text-slate-100">{p.name}</td>
                    <td className="p-3.5 text-xs text-slate-300">{p.email}</td>
                    <td className="p-3.5 text-xs font-mono text-cyan-400">{p.certificateId || '—'}</td>
                    <td className="p-3.5 text-xs">
                      {isEditing ? (
                        <select
                          value={selectedOverrideCertId}
                          onChange={(e) => setSelectedOverrideCertId(e.target.value)}
                          className="bg-slate-950 border border-cyan-500 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none"
                        >
                          <option value="">-- Unassign / None --</option>
                          {certificates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.filename}
                            </option>
                          ))}
                        </select>
                      ) : matchedCert ? (
                        <div className="flex items-center gap-2 text-slate-200 font-mono">
                          <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{matchedCert.filename}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No PDF Assigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={p.matchStatus} />
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveOverride(p.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Save
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {matchedCert && (
                            <button
                              onClick={() => setSelectedCertToPreview(matchedCert)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                              title="Preview PDF Certificate"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(p.id, p.matchedCertificateId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="Manually Assign / Override Certificate"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PDF Preview Modal */}
      <CertPreviewModal
        isOpen={!!selectedCertToPreview}
        onClose={() => setSelectedCertToPreview(null)}
        certFile={selectedCertToPreview}
      />
    </div>
  );
};

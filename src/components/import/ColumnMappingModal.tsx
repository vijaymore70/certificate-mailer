import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ColumnMapping, Participant, ParticipantValidationError } from '../../types/participant';
import { ParserService } from '../../services/parserService';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  rawRows: Record<string, any>[];
  suggestedMapping: ColumnMapping;
  onConfirmImport: (participants: Participant[]) => void;
  eventId: string;
  defaultEventName?: string;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  headers,
  rawRows,
  suggestedMapping,
  onConfirmImport,
  eventId,
  defaultEventName,
}) => {
  const [mapping, setMapping] = useState<ColumnMapping>(suggestedMapping);
  const [processedResult, setProcessedResult] = useState<{
    participants: Participant[];
    errors: ParticipantValidationError[];
  }>({ participants: [], errors: [] });

  useEffect(() => {
    setMapping(suggestedMapping);
  }, [suggestedMapping, isOpen]);

  useEffect(() => {
    if (rawRows.length > 0) {
      const res = ParserService.processAndValidateParticipants(
        rawRows,
        mapping,
        eventId,
        defaultEventName
      );
      setProcessedResult(res);
    }
  }, [mapping, rawRows, eventId, defaultEventName]);

  const handleMappingChange = (field: keyof ColumnMapping, header: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: header,
    }));
  };

  const handleImport = () => {
    onConfirmImport(processedResult.participants);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Map Spreadsheet Columns"
      subtitle="Ensure spreadsheet headers match standard participant fields before importing."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Mapping Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
              Participant Name *
            </label>
            <select
              value={mapping.name || ''}
              onChange={(e) => handleMappingChange('name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Select Column --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <select
              value={mapping.email || ''}
              onChange={(e) => handleMappingChange('email', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Select Column --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
              Certificate ID / Number *
            </label>
            <select
              value={mapping.certificateId || ''}
              onChange={(e) => handleMappingChange('certificateId', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Select Column --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Registration ID (Optional)
            </label>
            <select
              value={mapping.registrationId || ''}
              onChange={(e) => handleMappingChange('registrationId', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- None --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation Summary Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-200">Import Validation Summary</h4>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> {processedResult.participants.filter(p => p.status === 'PENDING').length} Valid
              </span>
              {processedResult.errors.length > 0 && (
                <span className="text-rose-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="h-4 w-4" /> {processedResult.errors.length} Warnings/Errors
                </span>
              )}
            </div>
          </div>

          {/* Validation Errors List */}
          {processedResult.errors.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-2 border-t border-slate-800 pt-3">
              {processedResult.errors.map((err, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-900/40">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              All rows passed validation standards cleanly. Click "Confirm & Import" to finish.
            </p>
          )}
        </div>

        {/* Sample Data Table Preview */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Sample Preview (First 3 Records)</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5">Certificate ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {processedResult.participants.slice(0, 3).map((p, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium">{p.name || '—'}</td>
                    <td className="p-2.5 text-slate-300">{p.email || '—'}</td>
                    <td className="p-2.5 text-cyan-400 font-mono">{p.certificateId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={processedResult.participants.length === 0 || !mapping.name || !mapping.email}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            <span>Confirm & Import ({processedResult.participants.length})</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

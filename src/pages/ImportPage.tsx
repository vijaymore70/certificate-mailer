import React, { useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { FileUploader } from '../components/import/FileUploader';
import { ColumnMappingModal } from '../components/import/ColumnMappingModal';
import { ParseResult } from '../services/parserService';
import { Participant } from '../types/participant';
import { FileSpreadsheet, Trash2, CheckCircle2, Download } from 'lucide-react';
import { TabType } from '../components/layout/Sidebar';
import { downloadExcelTemplate } from '../utils/exportCsv';

interface ImportPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const ImportPage: React.FC<ImportPageProps> = ({ setActiveTab }) => {
  const {
    activeEvent,
    participants,
    importParticipantsList,
    clearAllParticipants,
  } = useEventContext();

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);

  const handleFileParsed = (result: ParseResult) => {
    setParseResult(result);
    setIsMappingModalOpen(true);
  };

  const handleConfirmImport = async (newParticipants: Participant[]) => {
    await importParticipantsList(newParticipants);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Import Participants</h2>
          <p className="text-xs text-slate-400">
            Upload CSV or XLSX file containing participant names, email addresses, and certificate IDs.
          </p>
        </div>

        {participants.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => clearAllParticipants()}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 text-xs font-semibold text-rose-300 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Imported List ({participants.length})
            </button>
          </div>
        )}
      </div>

      {/* File Uploader with integrated Template Download */}
      <FileUploader onFileParsed={handleFileParsed} />

      {/* Already Imported List Summary */}
      {participants.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Currently Imported Participant List ({participants.length})
            </h3>
            <button
              onClick={() => setActiveTab('generator')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Proceed to Certificate Generator &rarr;
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Certificate ID</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {participants.slice(0, 10).map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-100">{p.name}</td>
                    <td className="p-3 text-slate-300">{p.email}</td>
                    <td className="p-3 font-mono text-cyan-400">{p.certificateId}</td>
                    <td className="p-3">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {participants.length > 10 && (
            <p className="text-xs text-slate-500 text-center">
              + {participants.length - 10} more records imported. View complete table in "Participants & Send".
            </p>
          )}
        </div>
      )}

      {/* Mapping Modal */}
      {parseResult && (
        <ColumnMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => setIsMappingModalOpen(false)}
          headers={parseResult.headers}
          rawRows={parseResult.rawRows}
          suggestedMapping={parseResult.suggestedMapping}
          onConfirmImport={handleConfirmImport}
          eventId={activeEvent?.id || 'DEFAULT'}
          defaultEventName={activeEvent?.name}
        />
      )}
    </div>
  );
};

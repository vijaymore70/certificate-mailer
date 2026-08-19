import React, { useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { CertDropzone } from '../components/certificates/CertDropzone';
import { CertPreviewModal } from '../components/certificates/CertPreviewModal';
import { CertificateFile } from '../types/certificate';
import { FileText, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { TabType } from '../components/layout/Sidebar';

interface CertificatesPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({ setActiveTab }) => {
  const {
    activeEvent,
    certificates,
    addCertificates,
    deleteCertificate,
    clearAllCertificates,
  } = useEventContext();

  const [previewCert, setPreviewCert] = useState<CertificateFile | null>(null);

  const handleCertificatesUploaded = async (newCerts: CertificateFile[]) => {
    await addCertificates(newCerts);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Upload PDF Certificates</h2>
          <p className="text-xs text-slate-400">
            Upload individual PDF certificates. Filenames can match Certificate IDs or Participant Names.
          </p>
        </div>

        {certificates.length > 0 && (
          <button
            onClick={() => clearAllCertificates()}
            className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 text-xs font-semibold text-rose-300 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear All PDFs ({certificates.length})
          </button>
        )}
      </div>

      {/* Dropzone */}
      <CertDropzone
        eventId={activeEvent?.id || 'DEFAULT'}
        onCertificatesUploaded={handleCertificatesUploaded}
      />

      {/* List of Uploaded Certificate Files */}
      {certificates.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Uploaded PDF Certificate Store ({certificates.length} Files)
            </h3>
            <button
              onClick={() => setActiveTab('preview')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Verify Certificate Matching &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 group hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{cert.filename}</p>
                    <span className="text-[10px] text-slate-500">{(cert.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewCert(cert)}
                    className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                    title="Preview PDF"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCertificate(cert.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete PDF"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <CertPreviewModal
        isOpen={!!previewCert}
        onClose={() => setPreviewCert(null)}
        certFile={previewCert}
      />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { CertificateFile } from '../../types/certificate';
import { FileText } from 'lucide-react';

interface CertPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certFile?: CertificateFile | null;
}

export const CertPreviewModal: React.FC<CertPreviewModalProps> = ({
  isOpen,
  onClose,
  certFile,
}) => {
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let activeUrl: string | null = null;

    if (certFile && isOpen) {
      let blob: Blob | null = null;

      if (certFile.base64Data) {
        try {
          const binaryStr = window.atob(certFile.base64Data);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'application/pdf' });
        } catch (e) {
          console.error('Error decoding base64 PDF string:', e);
        }
      } else if (certFile.blobData) {
        blob =
          certFile.blobData instanceof Blob
            ? certFile.blobData
            : new Blob([certFile.blobData], { type: 'application/pdf' });
      }

      if (blob) {
        activeUrl = URL.createObjectURL(blob);
        setPdfObjectUrl(activeUrl);
      } else {
        setPdfObjectUrl(null);
      }
    } else {
      setPdfObjectUrl(null);
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [certFile, isOpen]);

  if (!certFile) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${certFile.filename}`}
      subtitle={`File Size: ${(certFile.fileSize / 1024).toFixed(1)} KB`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {pdfObjectUrl ? (
          <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <object
              data={pdfObjectUrl}
              type="application/pdf"
              className="w-full h-full border-0"
            >
              <iframe
                src={pdfObjectUrl}
                title={certFile.filename}
                className="w-full h-full border-0"
              />
            </object>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <FileText className="h-12 w-12 text-slate-600 mb-2" />
            <p className="text-sm">Preview unavailable for this file.</p>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
          <span className="text-xs text-slate-500 font-mono">ID: {certFile.id}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

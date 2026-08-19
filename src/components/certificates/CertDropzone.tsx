import React, { useState, useRef } from 'react';
import { FileUp, FolderUp, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { CertificateFile } from '../../types/certificate';

interface CertDropzoneProps {
  eventId: string;
  onCertificatesUploaded: (files: CertificateFile[]) => void;
}

export const CertDropzone: React.FC<CertDropzoneProps> = ({ eventId, onCertificatesUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFileList = async (fileList: FileList | File[]) => {
    setLoading(true);
    setStatusMessage('Reading PDF certificate files...');
    const pdfFiles = Array.from(fileList).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setStatusMessage('No valid PDF files found in selection.');
      setLoading(false);
      return;
    }

    try {
      const certObjects: CertificateFile[] = [];
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const arrayBuffer = await file.arrayBuffer();

        // Convert arrayBuffer to base64
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = uint8Array.byteLength;
        for (let j = 0; j < len; j++) {
          binary += String.fromCharCode(uint8Array[j]);
        }
        const base64Data = window.btoa(binary);

        const certObj: CertificateFile = {
          id: `CERT_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          eventId,
          filename: file.name,
          fileSize: file.size,
          mimeType: 'application/pdf',
          blobData: arrayBuffer,
          base64Data,
          uploadedAt: new Date().toISOString(),
        };

        certObjects.push(certObj);
      }

      onCertificatesUploaded(certObjects);
      setStatusMessage(`Successfully processed ${certObjects.length} certificate PDF files.`);
    } catch (err: any) {
      console.error('Error processing PDF files:', err);
      setStatusMessage(`Error reading PDF files: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFileList(e.target.files);
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFileList(e.target.files);
          }}
        />

        <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
          <FileText className="h-7 w-7" />
        </div>

        <h3 className="text-base font-semibold text-slate-100 mb-1">
          {loading ? 'Processing Certificates...' : 'Upload PDF Certificates'}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm text-center mb-5">
          Drag and drop multiple PDF files or select an entire certificate folder from your computer.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            <FileUp className="h-4 w-4" />
            Select Multiple PDFs
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
          >
            <FolderUp className="h-4 w-4 text-cyan-400" />
            Select Certificate Folder
          </button>
        </div>

        {statusMessage && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

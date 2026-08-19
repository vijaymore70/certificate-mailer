import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, FileCode } from 'lucide-react';
import { ParserService, ParseResult } from '../../services/parserService';
import { downloadExcelTemplate, downloadCsvTemplate } from '../../utils/exportCsv';

interface FileUploaderProps {
  onFileParsed: (result: ParseResult, filename: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const parsed = await ParserService.parseFile(file);
      onFileParsed(parsed, file.name);
    } catch (err: any) {
      setError(err.message || 'Error reading spreadsheet file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* Download Template Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Need a sample spreadsheet format?</h4>
            <p className="text-[11px] text-slate-400">Download our pre-formatted template, fill in your participants, and upload below.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadExcelTemplate()}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Download Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => downloadCsvTemplate()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <FileCode className="h-3.5 w-3.5 text-cyan-400" /> Download CSV (.csv)
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-950/30'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-base font-semibold text-slate-100 mb-1">
          {loading ? 'Parsing Spreadsheet...' : 'Drop your CSV or XLSX file here'}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm text-center mb-4">
          Upload participant list spreadsheet. Supported formats: <span className="font-semibold text-slate-300">.csv, .xlsx, .xls</span>
        </p>

        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
          Browse Computer
        </button>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

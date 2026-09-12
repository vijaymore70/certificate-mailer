import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Wand2,
  Download,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  AlertCircle,
  FileUp,
  Check,
  Settings2,
} from 'lucide-react';
import { useEventContext } from '../context/EventContext';
import { ParserService, ParseResult } from '../services/parserService';
import {
  CertificateGeneratorService,
  TextFieldConfig,
  GeneratedCertificate,
} from '../services/certificateGeneratorService';
import { CertificateFile } from '../types/certificate';

export const CertificateGeneratorPage: React.FC = () => {
  const { activeEvent, addCertificates, importParticipantsList } = useEventContext();

  // Template State
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateType, setTemplateType] = useState<'image' | 'pdf'>('image');
  const [templateDataUrl, setTemplateDataUrl] = useState<string>('');
  const [templateBytes, setTemplateBytes] = useState<ArrayBuffer | null>(null);

  // Data File State
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // Mapped Columns
  const [nameColumn, setNameColumn] = useState<string>('');
  const [certIdColumn, setCertIdColumn] = useState<string>('');
  const [emailColumn, setEmailColumn] = useState<string>('');

  // Field Configs
  const [fieldConfigs, setFieldConfigs] = useState<TextFieldConfig[]>([
    {
      id: 'name',
      label: 'Participant Name',
      columnKey: '',
      xPercent: 50,
      yPercent: 50,
      fontSize: 32,
      fontColor: '#1e293b',
      fontStyle: 'bold',
      alignment: 'center',
    },
    {
      id: 'certId',
      label: 'Certificate ID',
      columnKey: '',
      xPercent: 50,
      yPercent: 75,
      fontSize: 16,
      fontColor: '#64748b',
      fontStyle: 'normal',
      alignment: 'center',
    },
    {
      id: 'date',
      label: 'Date / Custom Text',
      columnKey: '',
      isCustomText: true,
      customValue: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      xPercent: 50,
      yPercent: 82,
      fontSize: 14,
      fontColor: '#64748b',
      fontStyle: 'normal',
      alignment: 'center',
    },
  ]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('name');

  // Generation & Status state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [generatedResults, setGeneratedResults] = useState<{
    certificates: GeneratedCertificate[];
    zipBlob: Blob;
  } | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const templateImageRef = useRef<HTMLImageElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Handle Template File Upload
  const handleTemplateUpload = async (file: File) => {
    try {
      setErrorMsg('');
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const arrayBuffer = await file.arrayBuffer();
      setTemplateBytes(arrayBuffer);
      setTemplateFile(file);

      if (isPdf) {
        setTemplateType('pdf');
        const pdfDataUrl = URL.createObjectURL(file);
        setTemplateDataUrl(pdfDataUrl);
      } else {
        setTemplateType('image');
        const url = URL.createObjectURL(file);
        setTemplateDataUrl(url);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to load template file: ${err.message}`);
    }
  };

  // Handle Data File Upload (Excel or CSV)
  const handleDataUpload = async (file: File) => {
    try {
      setErrorMsg('');
      const result = await ParserService.parseFile(file);
      setDataFile(file);
      setParsedData(result);
      setSelectedRowIndex(0);

      // Auto set columns
      const autoName = result.suggestedMapping.name || result.headers[0] || '';
      const autoEmail = result.suggestedMapping.email || '';
      const autoCertId = result.suggestedMapping.certificateId || '';

      setNameColumn(autoName);
      setEmailColumn(autoEmail);
      setCertIdColumn(autoCertId);

      // Update default field configs column keys
      setFieldConfigs((prev) =>
        prev.map((f) => {
          if (f.id === 'name') return { ...f, columnKey: autoName };
          if (f.id === 'certId') return { ...f, columnKey: autoCertId };
          return f;
        })
      );
    } catch (err: any) {
      setErrorMsg(`Failed to parse data file: ${err.message}`);
    }
  };

  // Handle Click on Preview Canvas to position active text field
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewContainerRef.current || !selectedFieldId) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.round((clickX / rect.width) * 100);
    const yPercent = Math.round((clickY / rect.height) * 100);

    setFieldConfigs((prev) =>
      prev.map((f) =>
        f.id === selectedFieldId
          ? {
              ...f,
              xPercent: Math.max(0, Math.min(100, xPercent)),
              yPercent: Math.max(0, Math.min(100, yPercent)),
            }
          : f
      )
    );
  };

  // Field Config Helpers
  const updateSelectedField = (key: keyof TextFieldConfig, value: any) => {
    setFieldConfigs((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, [key]: value } : f))
    );
  };

  const addCustomField = () => {
    const newId = `field_${Date.now()}`;
    const newField: TextFieldConfig = {
      id: newId,
      label: `Field ${fieldConfigs.length + 1}`,
      columnKey: parsedData?.headers[0] || '',
      xPercent: 50,
      yPercent: 60,
      fontSize: 20,
      fontColor: '#1e293b',
      fontStyle: 'normal',
      alignment: 'center',
    };
    setFieldConfigs((prev) => [...prev, newField]);
    setSelectedFieldId(newId);
  };

  const removeField = (id: string) => {
    setFieldConfigs((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      const remaining = fieldConfigs.filter((f) => f.id !== id);
      setSelectedFieldId(remaining[0]?.id || '');
    }
  };

  // Active row data helper
  const currentRowData = parsedData?.rawRows[selectedRowIndex] || {};

  // Batch PDF Generation
  const handleBatchGenerate = async () => {
    if (!templateBytes || !templateFile) {
      setErrorMsg('Please upload a certificate template file.');
      return;
    }
    if (!parsedData || parsedData.rawRows.length === 0) {
      setErrorMsg('Please upload an Excel or CSV data file with participants.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg('');
      setImportStatus('');

      const result = await CertificateGeneratorService.batchGenerate(
        templateBytes,
        templateType,
        templateFile.type,
        fieldConfigs,
        parsedData.rawRows,
        nameColumn,
        certIdColumn,
        emailColumn,
        (current, total) => {
          setGenerationProgress({ current, total });
        }
      );

      setGeneratedResults(result);
    } catch (err: any) {
      setErrorMsg(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download ZIP
  const handleDownloadZip = () => {
    if (!generatedResults) return;
    const url = URL.createObjectURL(generatedResults.zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificates_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import directly into CertMailer Event
  const handleImportToEvent = async () => {
    if (!generatedResults || !activeEvent) return;

    try {
      setImportStatus('Importing certificates into active event...');

      const certFiles: CertificateFile[] = generatedResults.certificates.map((cert, idx) => ({
        id: `gen_cert_${Date.now()}_${idx}`,
        eventId: activeEvent.id,
        filename: cert.filename,
        fileSize: cert.pdfBlob.size,
        mimeType: 'application/pdf',
        blobData: cert.arrayBuffer,
        uploadedAt: new Date().toISOString(),
      }));

      // 1. Add generated certificate files
      await addCertificates(certFiles);

      // 2. Add participants if data was parsed
      const participantsData = generatedResults.certificates.map((cert, idx) => ({
        id: `P_${activeEvent.id}_gen_${Date.now()}_${idx}`,
        eventId: activeEvent.id,
        name: cert.participantName,
        email: cert.email || '',
        certificateId: cert.certificateId || cert.participantName.replace(/\s+/g, '_'),
        registrationId: '',
        eventName: activeEvent.name,
        status: (cert.email ? 'PENDING' : 'INVALID') as any,
        matchStatus: 'MATCHED' as any,
        matchedCertificateId: certFiles[idx].id,
        attempts: 0,
      }));

      await importParticipantsList(participantsData);

      setImportStatus(
        `Successfully imported ${certFiles.length} generated certificates into event "${activeEvent.name}"!`
      );
    } catch (err: any) {
      setErrorMsg(`Failed to import to event: ${err.message}`);
      setImportStatus('');
    }
  };

  const selectedFieldConfig = fieldConfigs.find((f) => f.id === selectedFieldId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Wand2 className="h-6 w-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                Certificate Generator
              </h1>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Upload your certificate template design (Image/PDF) and an Excel list of names. Position text fields visually, preview in real time, and batch-generate individual PDF certificates.
            </p>
          </div>

          {parsedData && templateFile && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating... ({generationProgress.current}/{generationProgress.total})</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    <span>Generate Certificates ({parsedData.rawRows.length})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error / Success Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {importStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Step 1: Upload Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template Upload Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-200">1. Certificate Template</h2>
                  <p className="text-xs text-slate-400">PNG, JPG, or PDF file</p>
                </div>
              </div>
              {templateFile && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Uploaded
                </span>
              )}
            </div>

            {!templateFile ? (
              <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group text-center">
                <FileUp className="h-10 w-10 text-slate-500 group-hover:text-cyan-400 transition-colors mb-3" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-cyan-300">
                  Click or drag certificate template here
                </span>
                <span className="text-xs text-slate-500 mt-1">Supports PNG, JPG, or PDF</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-200 truncate">{templateFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {(templateFile.size / 1024).toFixed(1)} KB • {templateType.toUpperCase()}
                    </p>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer transition-colors shrink-0">
                  Change
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Excel Data Upload Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-200">2. Excel / CSV Data File</h2>
                  <p className="text-xs text-slate-400">List of names and details</p>
                </div>
              </div>
              {dataFile && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Uploaded
                </span>
              )}
            </div>

            {!dataFile ? (
              <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group text-center">
                <FileSpreadsheet className="h-10 w-10 text-slate-500 group-hover:text-emerald-400 transition-colors mb-3" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-emerald-300">
                  Click or drag Excel or CSV file here
                </span>
                <span className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, or .csv</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => e.target.files?.[0] && handleDataUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-200 truncate">{dataFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {parsedData?.rawRows.length || 0} Records Found
                      </p>
                    </div>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer transition-colors shrink-0">
                    Change
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => e.target.files?.[0] && handleDataUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Column Selector */}
                {parsedData && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Name Column:</label>
                      <select
                        value={nameColumn}
                        onChange={(e) => {
                          setNameColumn(e.target.value);
                          setFieldConfigs((prev) =>
                            prev.map((f) => (f.id === 'name' ? { ...f, columnKey: e.target.value } : f))
                          );
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Cert ID Column:</label>
                      <select
                        value={certIdColumn}
                        onChange={(e) => {
                          setCertIdColumn(e.target.value);
                          setFieldConfigs((prev) =>
                            prev.map((f) =>
                              f.id === 'certId' ? { ...f, columnKey: e.target.value } : f
                            )
                          );
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="">(None)</option>
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Results Action Banner */}
      {generatedResults && (
        <div className="bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">
                {generatedResults.certificates.length} Certificates Generated Successfully!
              </h3>
              <p className="text-slate-400 text-xs">
                Named cleanly as &lt;Participant_Name&gt;.pdf inside ZIP bundle.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadZip}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-all shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Download ZIP</span>
            </button>

            {activeEvent && (
              <button
                onClick={handleImportToEvent}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-slate-700 transition-all"
              >
                <Send className="h-4 w-4 text-cyan-400" />
                <span>Import to Event Mailer</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Interactive Editor & Live Row Preview */}
      {templateFile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Canvas Preview (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-cyan-400" />
                <h2 className="font-semibold text-slate-200">Interactive Canvas Preview</h2>
                <span className="text-xs text-slate-500">
                  (Click template to move selected field position)
                </span>
              </div>

              {/* Row Navigator */}
              {parsedData && parsedData.rawRows.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                  <button
                    onClick={() => setSelectedRowIndex((prev) => Math.max(0, prev - 1))}
                    disabled={selectedRowIndex === 0}
                    className="hover:text-cyan-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-medium text-slate-200">
                    Row {selectedRowIndex + 1} of {parsedData.rawRows.length}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedRowIndex((prev) =>
                        Math.min(parsedData.rawRows.length - 1, prev + 1)
                      )
                    }
                    disabled={selectedRowIndex === parsedData.rawRows.length - 1}
                    className="hover:text-cyan-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Template Container Canvas */}
            <div className="relative w-full flex items-center justify-center bg-slate-950 border border-slate-800/80 rounded-xl p-2 overflow-hidden min-h-[350px] select-none">
              <div
                ref={previewContainerRef}
                onClick={handlePreviewClick}
                className="relative w-full max-w-3xl aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden shadow-2xl cursor-crosshair border border-slate-800/60"
              >
                {templateType === 'image' && templateDataUrl ? (
                  <img
                    ref={templateImageRef}
                    src={templateDataUrl}
                    alt="Certificate Template"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6 text-center">
                    <FileText className="h-16 w-16 text-cyan-500/40 mb-3" />
                    <p className="text-sm font-medium text-slate-300">PDF Template Loaded</p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Text position markers overlay live on PDF coordinates.
                    </p>
                  </div>
                )}

                {/* Render Text Fields Overlay */}
                {fieldConfigs.map((field) => {
                  const isSelected = field.id === selectedFieldId;
                  const textValue = field.isCustomText
                    ? field.customValue || ''
                    : String(currentRowData[field.columnKey] || `[${field.label}]`).trim();

                  let alignClass = '-translate-x-1/2';
                  if (field.alignment === 'left') alignClass = 'translate-x-0';
                  if (field.alignment === 'right') alignClass = '-translate-x-full';

                  return (
                    <div
                      key={field.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFieldId(field.id);
                      }}
                      style={{
                        left: `${field.xPercent}%`,
                        top: `${field.yPercent}%`,
                      }}
                      className={`absolute -translate-y-1/2 ${alignClass} cursor-pointer group transition-all duration-75`}
                    >
                      {/* Active highlight frame */}
                      <div
                        className={`relative px-2 py-0.5 rounded transition-all ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 bg-cyan-500/10 shadow-lg'
                            : 'hover:ring-1 hover:ring-slate-400/50'
                        }`}
                      >
                        <span
                          style={{
                            color: field.fontColor,
                            fontSize: `${Math.max(12, Math.min(36, field.fontSize * 0.55))}px`,
                            fontWeight: field.fontStyle === 'bold' ? 'bold' : 'normal',
                            fontStyle: field.fontStyle === 'italic' ? 'italic' : 'normal',
                          }}
                          className="whitespace-nowrap drop-shadow-sm"
                        >
                          {textValue || `[${field.label}]`}
                        </span>

                        {/* Field Badge Label */}
                        <div
                          className={`absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shadow-md pointer-events-none transition-opacity ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 opacity-100'
                              : 'bg-slate-800 text-slate-300 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {field.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Configuration Controls Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-cyan-400" /> Field Configuration
                </h2>
                <button
                  onClick={addCustomField}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium transition-colors border border-cyan-500/20"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Field
                </button>
              </div>

              {/* Field Tabs Selector */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {fieldConfigs.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedFieldId === f.id
                        ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Active Field Property Settings */}
              {selectedFieldConfig ? (
                <div className="space-y-4 text-xs">
                  {/* Field Label & Source */}
                  <div>
                    <label className="text-slate-400 block mb-1">Field Label:</label>
                    <input
                      type="text"
                      value={selectedFieldConfig.label}
                      onChange={(e) => updateSelectedField('label', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Excel Column vs Custom Text */}
                  <div>
                    <label className="text-slate-400 block mb-1">Data Source:</label>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          checked={!selectedFieldConfig.isCustomText}
                          onChange={() => updateSelectedField('isCustomText', false)}
                          className="accent-cyan-500"
                        />
                        Excel Column
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer ml-3">
                        <input
                          type="radio"
                          checked={!!selectedFieldConfig.isCustomText}
                          onChange={() => updateSelectedField('isCustomText', true)}
                          className="accent-cyan-500"
                        />
                        Custom Text
                      </label>
                    </div>

                    {!selectedFieldConfig.isCustomText ? (
                      <select
                        value={selectedFieldConfig.columnKey}
                        onChange={(e) => updateSelectedField('columnKey', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="">(Select Column)</option>
                        {parsedData?.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedFieldConfig.customValue || ''}
                        onChange={(e) => updateSelectedField('customValue', e.target.value)}
                        placeholder="e.g. October 15, 2026"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Styling Controls */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Font Size (pt):</label>
                      <input
                        type="number"
                        min="8"
                        max="120"
                        value={selectedFieldConfig.fontSize}
                        onChange={(e) =>
                          updateSelectedField('fontSize', parseInt(e.target.value) || 24)
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Font Color:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedFieldConfig.fontColor}
                          onChange={(e) => updateSelectedField('fontColor', e.target.value)}
                          className="h-8 w-10 bg-transparent rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedFieldConfig.fontColor}
                          onChange={(e) => updateSelectedField('fontColor', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:border-cyan-500 focus:outline-none uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Font Style:</label>
                      <select
                        value={selectedFieldConfig.fontStyle}
                        onChange={(e) => updateSelectedField('fontStyle', e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="italic">Italic</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Alignment:</label>
                      <select
                        value={selectedFieldConfig.alignment}
                        onChange={(e) => updateSelectedField('alignment', e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="center">Center</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  {/* Positioning Sliders */}
                  <div className="space-y-2 pt-2">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Horizontal Position (X %):</span>
                        <span className="text-cyan-400 font-medium">{selectedFieldConfig.xPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedFieldConfig.xPercent}
                        onChange={(e) =>
                          updateSelectedField('xPercent', parseInt(e.target.value) || 0)
                        }
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Vertical Position (Y %):</span>
                        <span className="text-cyan-400 font-medium">{selectedFieldConfig.yPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedFieldConfig.yPercent}
                        onChange={(e) =>
                          updateSelectedField('yPercent', parseInt(e.target.value) || 0)
                        }
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {fieldConfigs.length > 1 && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => removeField(selectedFieldConfig.id)}
                        className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove Field
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No field selected.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateGeneratorPage;

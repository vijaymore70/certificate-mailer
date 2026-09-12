import React, { useState, useEffect } from 'react';
import { useEventContext } from '../../context/EventContext';
import { EmailTemplate } from '../../types/template';
import { Mail, Send, Sparkles, Check, Info } from 'lucide-react';
import { TestEmailModal } from '../sending/TestEmailModal';

/**
 * Strip raw HTML tags for clean plain-text editing
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }
  return html
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Convert plain text with line breaks into formatted HTML paragraphs for email delivery
 */
function plainTextToHtml(text: string): string {
  if (!text) return '';
  if (/<(p|br|div|strong|b)[\s/>]/i.test(text)) {
    return text;
  }

  return text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br>');
}

export const TemplateEditor: React.FC = () => {
  const { activeEvent, updateTemplate, participants } = useEventContext();

  const initialTemplate = activeEvent?.emailTemplate || {
    id: '',
    eventId: '',
    fromName: 'Refresh Technology',
    replyTo: '',
    subject: 'Your Participation Certificate – {{event_name}}',
    bodyHtml: `Dear {{name}},\nThank you for participating in {{event_name}}.\nPlease find your participation certificate attached to this email.\nCertificate ID: {{certificate_id}}\nRegistration ID: {{registration_id}}\nRegards,\nRefresh Technology`,
    updatedAt: '',
  };

  const [fromName, setFromName] = useState(initialTemplate.fromName);
  const [replyTo, setReplyTo] = useState(initialTemplate.replyTo || '');
  const [subject, setSubject] = useState(initialTemplate.subject);
  const [bodyText, setBodyText] = useState(htmlToPlainText(initialTemplate.bodyHtml));

  const [saved, setSaved] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  useEffect(() => {
    if (activeEvent?.emailTemplate) {
      setFromName(activeEvent.emailTemplate.fromName);
      setReplyTo(activeEvent.emailTemplate.replyTo || '');
      setSubject(activeEvent.emailTemplate.subject);
      setBodyText(htmlToPlainText(activeEvent.emailTemplate.bodyHtml));
    }
  }, [activeEvent]);

  const handleInsertVariable = (variable: string) => {
    setBodyText((prev) => prev + ` ${variable} `);
  };

  const handleSave = async () => {
    const formattedHtml = plainTextToHtml(bodyText);
    const updated: EmailTemplate = {
      id: activeEvent?.emailTemplate.id || `TMPL_${Date.now()}`,
      eventId: activeEvent?.id || 'DEFAULT',
      fromName,
      replyTo,
      subject,
      bodyHtml: formattedHtml,
      updatedAt: new Date().toISOString(),
    };

    await updateTemplate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');

  // Selected or sample participant for live preview
  const sampleParticipant =
    participants.find((p) => p.id === selectedParticipantId) ||
    participants[0] || {
      name: 'Rahul Patil',
      email: 'rahul.patil@example.com',
      certificateId: 'CERT001',
      registrationId: 'REG-1001',
    };

  const sampleDataMap: Record<string, string> = {
    name: sampleParticipant.name,
    email: sampleParticipant.email,
    certificate_id: sampleParticipant.certificateId || 'CERT001',
    registration_id: sampleParticipant.registrationId || 'REG-1001',
    event_name: activeEvent?.name || 'Annual Seminar 2026',
  };

  const renderInterpolatedText = (str: string) => {
    let res = str || '';
    Object.keys(sampleDataMap).forEach((k) => {
      const reg = new RegExp(`{{\\s*${k}\\s*}}`, 'gi');
      res = res.replace(reg, sampleDataMap[k]);
    });
    return res;
  };

  const variables = [
    { label: 'Participant Name', key: '{{name}}' },
    { label: 'Participant Email', key: '{{email}}' },
    { label: 'Certificate ID', key: '{{certificate_id}}' },
    { label: 'Event Name', key: '{{event_name}}' },
    { label: 'Registration ID', key: '{{registration_id}}' },
  ];

  // Current HTML for test modal
  const currentFormattedTemplate: EmailTemplate = {
    id: activeEvent?.emailTemplate.id || 'TMPL',
    eventId: activeEvent?.id || 'DEFAULT',
    fromName,
    replyTo,
    subject,
    bodyHtml: plainTextToHtml(bodyText),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Personalized Email Template Builder</h3>
          <p className="text-xs text-slate-400">
            Customize the subject line and email body text for your event participants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4 text-cyan-400" />
            Send Test Email
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            {saved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simple Editor Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                From Name
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="e.g. Refresh Technology"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Reply-To Email (Optional)
              </label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="e.g. support@refreshtech.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Subject Line *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your Participation Certificate – {{event_name}}"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>



          {/* Simple Text Body Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email Message Body *
              </label>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3 text-cyan-400" /> Type naturally; line breaks are preserved automatically.
              </span>
            </div>
            <textarea
              rows={12}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write your email message here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Live Rendering Email Preview Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              Live Email Preview
            </h4>
            {participants.length > 0 ? (
              <select
                value={selectedParticipantId || sampleParticipant.id}
                onChange={(e) => setSelectedParticipantId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    Preview for: {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-slate-500">
                Sample Participant: <strong className="text-slate-300">{sampleParticipant.name}</strong>
              </span>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-y-auto space-y-4">
            <div className="text-xs text-slate-400 space-y-1 pb-3 border-b border-slate-800 font-mono">
              <p><strong className="text-slate-300">From:</strong> {fromName || 'Refresh Technology'}</p>
              <p><strong className="text-slate-300">To:</strong> {sampleParticipant.email}</p>
              <p><strong className="text-slate-300">Subject:</strong> {renderInterpolatedText(subject)}</p>
              <p className="text-cyan-400"><strong className="text-slate-300">Attachment:</strong> {sampleParticipant.matchedCertificateFilename || `${sampleParticipant.name.replace(/\s+/g, '_')}.pdf`}</p>
            </div>

            {/* Rendered Email Body Preview */}
            <div
              className="text-sm text-slate-200 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: renderInterpolatedText(plainTextToHtml(bodyText)) }}
            />
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      <TestEmailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        template={currentFormattedTemplate}
      />
    </div>
  );
};

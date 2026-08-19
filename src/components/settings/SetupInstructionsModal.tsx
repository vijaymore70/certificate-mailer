import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Copy, Check, ExternalLink, Code } from 'lucide-react';

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APPS_SCRIPT_CODE = `/**
 * Certificate Mailer - Google Apps Script Backend
 * Main Router & Request Handler
 */

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action;
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try { postData = JSON.parse(e.postData.contents); if (postData.action && !action) action = postData.action; } catch (err) {}
    }
    if (!action) action = 'ping';

    var result = {};
    if (action === 'ping') {
      result = { success: true, status: 'CONNECTED', quota: MailApp.getRemainingDailyQuota() };
    } else if (action === 'sendTestEmail' || action === 'sendSingleEmail') {
      result = sendEmailHandler(postData);
    } else {
      result = { success: true, quota: MailApp.getRemainingDailyQuota() };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendEmailHandler(payload) {
  try {
    var recipient = payload.testEmail || payload.email;
    if (!recipient) return { success: false, message: 'Missing recipient email' };
    var remainingQuota = MailApp.getRemainingDailyQuota();
    if (remainingQuota <= 0) return { success: false, status: 'QUOTA_EXHAUSTED', remainingQuota: 0 };
    
    var attachments = [];
    if (payload.pdfBase64) {
      var pdfBytes = Utilities.base64Decode(payload.pdfBase64);
      var pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', payload.pdfFilename || 'Certificate.pdf');
      attachments.push(pdfBlob);
    }
    
    MailApp.sendEmail({
      to: recipient,
      subject: payload.subject || 'Your Participation Certificate',
      htmlBody: payload.bodyHtml || 'Dear Participant, please find attached your certificate.',
      name: payload.fromName || 'Certificate Mailer',
      attachments: attachments
    });
    
    return { success: true, status: 'SENT', remainingQuota: MailApp.getRemainingDailyQuota() };
  } catch (err) {
    return { success: false, status: 'FAILED', message: err.toString() };
  }
}`;

export const SetupInstructionsModal: React.FC<SetupInstructionsModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Apps Script Setup Guide"
      subtitle="Follow these simple 4 steps to connect your free Gmail email dispatcher."
      maxWidth="3xl"
    >
      <div className="space-y-6 pt-2 text-sm text-slate-300">
        {/* Step 1 */}
        <div className="flex gap-4 items-start bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-sm">
            1
          </span>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-slate-100">Open Google Apps Script Dashboard</h4>
            <p className="text-xs text-slate-400">
              Go to{' '}
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline inline-flex items-center gap-1"
              >
                script.google.com <ExternalLink className="h-3 w-3" />
              </a>{' '}
              and click <strong>"New project"</strong>.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 items-start bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-sm">
            2
          </span>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-100">Paste Apps Script Backend Code</h4>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied Code!' : 'Copy Code'}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Replace everything in `Code.gs` with the script provided in your repository under <code className="text-cyan-300 font-mono">google-apps-script/Code.gs</code>.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4 items-start bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-sm">
            3
          </span>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-slate-100">Deploy as Web App</h4>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
              <li>Click <strong>Deploy &gt; New deployment</strong> in top right.</li>
              <li>Select type <strong>Web app</strong>.</li>
              <li>Set <strong>Execute as:</strong> <code className="text-slate-200">Me (your email)</code>.</li>
              <li>Set <strong>Who has access:</strong> <code className="text-cyan-400 font-bold">Anyone</code> (Important so frontend can connect).</li>
              <li>Click <strong>Deploy</strong> and grant standard Gmail permissions when prompted.</li>
            </ul>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4 items-start bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-sm">
            4
          </span>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-slate-100">Copy Web App URL into Settings</h4>
            <p className="text-xs text-slate-400">
              Copy the generated Web App URL (starts with <code className="text-slate-300 font-mono">https://script.google.com/macros/s/.../exec</code>) and paste it into the Settings page of this app.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
};

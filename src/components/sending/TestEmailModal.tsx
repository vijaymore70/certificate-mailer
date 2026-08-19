import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { EmailTemplate } from '../../types/template';
import { GasService } from '../../services/gasService';
import { useEventContext } from '../../context/EventContext';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate;
}

export const TestEmailModal: React.FC<TestEmailModalProps> = ({ isOpen, onClose, template }) => {
  const { activeEvent, certificates, showToast } = useEventContext();
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setLoading(true);
    setResult(null);

    // Pick first available sample cert PDF if uploaded
    const sampleCert = certificates[0];
    let pdfBase64 = sampleCert?.base64Data;

    try {
      const res = await GasService.sendTestEmail({
        testEmail: testEmail.trim(),
        fromName: template.fromName,
        replyTo: template.replyTo,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        pdfBase64,
        pdfFilename: sampleCert?.filename || 'Sample_Certificate.pdf',
        eventName: activeEvent?.name || 'Annual Seminar 2026',
      });

      setResult({
        success: res.success,
        message: res.message || (res.success ? 'Test email dispatched successfully!' : 'Failed to send test email.'),
      });

      if (res.success) {
        showToast(`Test email sent to ${testEmail}!`, 'success');
      } else {
        showToast(res.message || 'Error sending test email', 'error');
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Error executing test send.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Test Certificate Email"
      subtitle="Verify template layout and attachment before launching bulk dispatches."
      maxWidth="md"
    >
      <form onSubmit={handleSendTest} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Test Email Address *
          </label>
          <input
            type="email"
            required
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="enter-your-email@gmail.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
          <p><strong className="text-slate-300">Subject:</strong> {template.subject}</p>
          <p><strong className="text-slate-300">Sample Attachment:</strong> {certificates[0]?.filename || 'Sample_Certificate.pdf'}</p>
        </div>

        {result && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              result.success
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span>{result.message}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={loading || !testEmail.trim()}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Sending Test...' : 'Send Test Email'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

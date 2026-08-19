import React, { useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { SetupInstructionsModal } from '../components/settings/SetupInstructionsModal';
import { ShieldCheck, Zap, RefreshCw, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { gasSettings, updateGasSettings, testGasConnection, showToast } = useEventContext();

  const [webAppUrl, setWebAppUrl] = useState(gasSettings.webAppUrl);
  const [batchDelayMs, setBatchDelayMs] = useState(gasSettings.batchDelayMs || 1200);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGasSettings({
      webAppUrl: webAppUrl.trim(),
      batchDelayMs,
    });
    showToast('Settings saved successfully.', 'success');
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await updateGasSettings({ webAppUrl: webAppUrl.trim(), batchDelayMs });
      await testGasConnection();
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Application & Integration Settings</h2>
        <p className="text-xs text-slate-400">
          Configure Google Apps Script backend URL and batch dispatching parameters.
        </p>
      </div>

      {/* Security & Credentials Guarantee Card */}
      <div className="bg-gradient-to-r from-slate-900 to-cyan-950 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
        <ShieldCheck className="h-7 w-7 text-cyan-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-100">Zero Password & Secret Exposure Guarantee</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            This application communicates with Google Apps Script via secure HTTPS web app endpoints. No Gmail passwords, private keys, or OAuth secrets are stored or transmitted in frontend code.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Google Apps Script Web App URL
            </label>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
            >
              <BookOpen className="h-3.5 w-3.5" /> How to get Web App URL?
            </button>
          </div>

          <input
            type="url"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />

          {/* Connection status banner */}
          <div className="mt-3 flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              {gasSettings.connected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Backend Connected & Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-300 font-semibold">Operating in Local Simulation Mode</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !webAppUrl.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>

        {/* Dispatch Throttling Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800 pt-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Batch Sending Delay (Milliseconds)
            </label>
            <input
              type="number"
              min={500}
              max={5000}
              step={100}
              value={batchDelayMs}
              onChange={(e) => setBatchDelayMs(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Time delay between email sends to prevent triggering email provider rate limits.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Daily Email Quota State
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>Remaining Daily Quota:</span>
              <span className="text-amber-400 font-bold text-sm">{gasSettings.remainingQuota} Emails</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Guide Modal */}
      <SetupInstructionsModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

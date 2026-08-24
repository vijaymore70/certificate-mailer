import React from 'react';
import { useEventContext } from '../../context/EventContext';
import { Calendar, Zap, CheckCircle, AlertTriangle, RefreshCw, Menu } from 'lucide-react';
import { TabType } from './Sidebar';

interface TopbarProps {
  setActiveTab: (tab: TabType) => void;
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setActiveTab, onMenuClick }) => {
  const {
    events,
    activeEvent,
    setActiveEventId,
    gasSettings,
    testGasConnection,
  } = useEventContext();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Event Selector */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-slate-300">
          <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-400 hidden lg:inline">Event:</span>
          <select
            value={activeEvent?.id || ''}
            onChange={(e) => setActiveEventId(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer pr-2 max-w-[120px] md:max-w-[200px] truncate"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id} className="bg-slate-900 text-slate-100">
                {evt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Badges & Status */}
      <div className="flex items-center gap-4">
        {/* Daily Quota Indicator */}
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          <div className="text-xs">
            <span className="text-slate-400">Daily Quota: </span>
            <span className="font-bold text-slate-100">{gasSettings.remainingQuota}</span>
            <span className="text-[10px] text-slate-400 ml-1">remaining</span>
          </div>
        </div>

        {/* Apps Script Connection Badge */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            gasSettings.connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
          title="Click to manage Apps Script Connection Settings"
        >
          {gasSettings.connected ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Backend Connected</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Simulation Mode</span>
            </>
          )}
        </button>

        {/* Refresh Connection */}
        <button
          onClick={() => testGasConnection()}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          title="Refresh Quota & Test Connection"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

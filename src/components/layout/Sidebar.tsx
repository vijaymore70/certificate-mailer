import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileSpreadsheet,
  FileText,
  Eye,
  Mail,
  Users,
  History,
  Settings,
  Award,
  Wand2,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'events'
  | 'import'
  | 'certificates'
  | 'preview'
  | 'template'
  | 'participants'
  | 'history'
  | 'settings'
  | 'generator';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen = false }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'import', label: 'Import Data', icon: FileSpreadsheet },
    { id: 'certificates', label: 'Upload Certificates', icon: FileText },
    { id: 'generator', label: 'Certificate Generator', icon: Wand2 },
    { id: 'preview', label: 'Matching Preview', icon: Eye },
    { id: 'template', label: 'Email Template', icon: Mail },
    { id: 'participants', label: 'Participants & Send', icon: Users },
    { id: 'history', label: 'Sending History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-full shrink-0 select-none transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-none">
              CertMailer
            </h1>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/60 text-[11px] text-slate-500 text-center leading-relaxed">
        Certificate Mailer v1.0<br/>
        Powered by <a href="https://share.google/znY5oLOy6SAU1dAPP" target="_blank" rel="noopener noreferrer" className="text-cyan-500 font-medium hover:text-cyan-400 hover:underline transition-colors">Refresh Technology, Buldhana.</a>
      </div>
    </aside>
  );
};

import React from 'react';
import { Sidebar, TabType } from './Sidebar';
import { Topbar } from './Topbar';
import { NotificationToastContainer } from '../common/NotificationToast';

interface LayoutProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">{children}</main>
      </div>
      <NotificationToastContainer />
    </div>
  );
};

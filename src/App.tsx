import React, { useState } from 'react';
import { EventProvider } from './context/EventContext';
import { Layout } from './components/layout/Layout';
import { TabType } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { ImportPage } from './pages/ImportPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { CertificateGeneratorPage } from './pages/CertificateGeneratorPage';
import { PreviewPage } from './pages/PreviewPage';
import { TemplatePage } from './pages/TemplatePage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'events':
        return <EventsPage />;
      case 'import':
        return <ImportPage setActiveTab={setActiveTab} />;
      case 'certificates':
        return <CertificatesPage setActiveTab={setActiveTab} />;
      case 'generator':
        return <CertificateGeneratorPage />;
      case 'preview':
        return <PreviewPage />;
      case 'template':
        return <TemplatePage />;
      case 'participants':
        return <ParticipantsPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderTabContent()}
    </Layout>
  );
};

export function App() {
  return (
    <EventProvider>
      <AppContent />
    </EventProvider>
  );
}

export default App;

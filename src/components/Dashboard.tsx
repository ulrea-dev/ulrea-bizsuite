import React, { useState } from 'react';
import { DashboardHome } from './DashboardHome';
import { ProjectsPage } from './ProjectsPage';
import { TeamPage } from './TeamPage';
import { PartnersPage } from './PartnersPage';
import { ClientsPage } from './ClientsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { AppSidebar } from './AppSidebar';

import { SalariesPage } from './SalariesPage';

interface DashboardProps {
  onLogout: () => void;
  onCreateBusiness: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, onCreateBusiness }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'projects':
        return <ProjectsPage />;
      case 'team':
        return <TeamPage />;
      case 'partners':
        return <PartnersPage />;
      case 'clients':
        return <ClientsPage />;
      case 'salaries':
        return <SalariesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLogout={onLogout}
        onCreateBusiness={onCreateBusiness}
      />
      <div className="flex-1 p-6 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
};

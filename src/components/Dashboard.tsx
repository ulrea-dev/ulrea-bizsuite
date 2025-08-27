
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
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface DashboardProps {
  onLogout: () => void;
  onCreateBusiness: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, onCreateBusiness }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const handleNavigateToProject = (projectId: string) => {
    // This could be enhanced to navigate to specific project details
    setCurrentPage('projects');
  };

  const handleSelectBusiness = (businessId: string) => {
    // This could be enhanced for business switching functionality
    console.log('Business selected:', businessId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardHome
            onShowBusinessSetup={onCreateBusiness}
            onSelectBusiness={handleSelectBusiness}
            onCreateBusiness={onCreateBusiness}
            onNavigateToProject={handleNavigateToProject}
          />
        );
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
        return (
          <DashboardHome
            onShowBusinessSetup={onCreateBusiness}
            onSelectBusiness={handleSelectBusiness}
            onCreateBusiness={onCreateBusiness}
            onNavigateToProject={handleNavigateToProject}
          />
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar 
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onLogout={onLogout}
          onCreateBusiness={onCreateBusiness}
        />
        <SidebarInset>
          <div className="p-6 overflow-y-auto">
            {renderPage()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

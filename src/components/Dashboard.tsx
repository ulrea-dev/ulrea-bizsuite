
import React, { useState } from 'react';
import { DashboardHome } from './DashboardHome';
import { ProjectsPage } from './ProjectsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { ProjectDetailPage } from './ProjectDetailPage';
import { AppSidebar } from './AppSidebar';
import { FinancialsPage } from './FinancialsPage';
import { RetainerDetailPage } from './RetainerDetailPage';
import { TeamPage } from './TeamPage';
import { ClientsPage } from './ClientsPage';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface DashboardProps {
  onLogout: () => void;
  onCreateBusiness: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, onCreateBusiness }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRetainerId, setSelectedRetainerId] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setSelectedProjectId(null);
  };

  const onNavigateToPage = (page: string, itemId?: string) => {
    if (page === 'projects' && itemId) {
      setSelectedProjectId(itemId);
      setCurrentPage('project-detail');
    } else {
      setCurrentPage(page);
      setSelectedProjectId(null);
    }
  };

  const handleNavigateToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('project-detail');
  };

  const handleSelectBusiness = (businessId: string) => {
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
        return <ProjectsPage onNavigateToPage={onNavigateToPage} />;
      case 'project-detail':
        return selectedProjectId ? (
          <ProjectDetailPage 
            projectId={selectedProjectId}
            onBack={() => setCurrentPage('projects')}
          />
        ) : (
          <ProjectsPage onNavigateToPage={onNavigateToPage} />
        );
      case 'team':
        return <TeamPage />;
      case 'clients':
        return <ClientsPage />;
      case 'financials':
        return <FinancialsPage onNavigate={(page, id) => {
          if (page === 'retainer-detail' && id) {
            setSelectedRetainerId(id);
            setCurrentPage('retainer-detail');
          }
        }} />;
      case 'retainer-detail':
        return selectedRetainerId ? (
          <RetainerDetailPage 
            retainerId={selectedRetainerId}
            onBack={() => {
              setCurrentPage('financials');
              setSelectedRetainerId(null);
            }}
          />
        ) : (
          <FinancialsPage />
        );
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

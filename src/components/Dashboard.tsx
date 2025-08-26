import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { BusinessSetup } from './BusinessSetup';
import { ProjectsPage } from './ProjectsPage';
import { TeamPage } from './TeamPage';
import { PartnersPage } from './PartnersPage';
import { ClientsPage } from './ClientsPage';
import { ClientDetailPage } from './ClientDetailPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { MultiBusinessOverview } from './MultiBusinessOverview';
import { ProjectDetailPage } from './ProjectDetailPage';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { formatCurrency } from '@/utils/storage';
import { TrendingUp, FolderOpen, Users, DollarSign, Handshake } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { data, currentBusiness, switchBusiness } = useBusiness();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleNavigateToPage = (page: string, itemId?: string) => {
    if (page === 'projects' && itemId) {
      setSelectedProjectId(itemId);
      setCurrentPage('project-detail');
    } else if (page === 'client-detail' && itemId) {
      setSelectedClientId(itemId);
      setCurrentPage('client-detail');
    } else {
      setCurrentPage(page);
      setSelectedProjectId(null);
      setSelectedClientId(null);
    }
  };

  const renderPage = () => {
    if (currentPage === 'project-detail' && selectedProjectId) {
      return (
        <ProjectDetailPage 
          projectId={selectedProjectId} 
          onBack={() => setCurrentPage('projects')}
        />
      );
    }

    if (currentPage === 'client-detail' && selectedClientId) {
      return (
        <ClientDetailPage 
          clientId={selectedClientId} 
          onBack={() => setCurrentPage('clients')}
          onNavigateToProject={(projectId) => handleNavigateToPage('projects', projectId)}
        />
      );
    }

    switch (currentPage) {
      case 'projects':
        return <ProjectsPage onNavigateToPage={handleNavigateToPage} />;
      case 'team':
        return <TeamPage onNavigateToPage={handleNavigateToPage} />;
      case 'partners':
        return <PartnersPage onNavigateToPage={handleNavigateToPage} />;
      case 'clients':
        return <ClientsPage onNavigateToPage={handleNavigateToPage} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardHome 
            onShowBusinessSetup={() => setShowBusinessSetup(true)}
            onSelectBusiness={(businessId) => switchBusiness(businessId)}
            onCreateBusiness={() => setShowBusinessSetup(true)}
            onNavigateToProject={(projectId) => handleNavigateToPage('projects', projectId)}
          />
        );
    }
  };

  if (showBusinessSetup) {
    return (
      <div className="min-h-screen dashboard-surface flex items-center justify-center p-6">
        <BusinessSetup onComplete={() => setShowBusinessSetup(false)} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen dashboard-surface flex w-full">
        <AppSidebar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          onLogout={onLogout}
          onCreateBusiness={() => setShowBusinessSetup(true)}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b dashboard-border">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm dashboard-text-secondary">
                {currentBusiness?.name || 'No Business Selected'}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            {renderPage()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

interface DashboardHomeProps {
  onShowBusinessSetup: () => void;
  onSelectBusiness: (businessId: string) => void;
  onCreateBusiness: () => void;
  onNavigateToProject: (projectId: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ 
  onShowBusinessSetup, 
  onSelectBusiness, 
  onCreateBusiness,
  onNavigateToProject
}) => {
  const { data, currentBusiness } = useBusiness();

  if (data.businesses.length > 1 && (!currentBusiness || currentBusiness === null)) {
    return (
      <div className="p-6">
        <MultiBusinessOverview 
          onSelectBusiness={onSelectBusiness}
          onCreateBusiness={onCreateBusiness}
        />
      </div>
    );
  }

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <BusinessSetup onComplete={onShowBusinessSetup} />
      </div>
    );
  }

  const currentProjects = data.projects.filter(project => project.businessId === currentBusiness.id);
  const activeProjects = currentProjects.filter(project => project.status === 'active');
  const totalProjectValue = currentProjects.reduce((sum, project) => sum + project.totalValue, 0);
  const totalTeamAllocated = currentProjects.reduce((sum, project) => 
    sum + (project.teamAllocations?.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0) || 0), 0
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dashboard-text-primary">Dashboard</h1>
        <p className="dashboard-text-secondary">Welcome to {currentBusiness.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs dashboard-text-secondary">
              {formatCurrency(totalProjectValue, currentBusiness.currency)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teamMembers?.length || 0}</div>
            <p className="text-xs dashboard-text-secondary">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partners</CardTitle>
            <Handshake className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.partners?.length || 0}</div>
            <p className="text-xs dashboard-text-secondary">Business partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTeamAllocated, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Your currently active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjects.slice(0, 5).map(project => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-4 dashboard-surface-elevated rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onNavigateToProject(project.id)}
                >
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm dashboard-text-secondary">{project.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(
                        project.isMultiPhase && project.allocations?.length 
                          ? project.allocations.reduce((sum, allocation) => sum + allocation.budget, 0)
                          : project.totalValue,
                        currentBusiness.currency
                      )}
                    </div>
                    <div className="text-sm dashboard-text-secondary">
                      {project.teamAllocations?.length || 0} team members
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

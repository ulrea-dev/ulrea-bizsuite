
import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { BusinessSetup } from './BusinessSetup';
import { ProjectsPage } from './ProjectsPage';
import { TeamPage } from './TeamPage';
import { ClientsPage } from './ClientsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/storage';
import { TrendingUp, FolderOpen, Users, DollarSign } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { data, currentBusiness } = useBusiness();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectsPage />;
      case 'team':
        return <TeamPage />;
      case 'clients':
        return <ClientsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardHome onShowBusinessSetup={() => setShowBusinessSetup(true)} />;
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
    <div className="min-h-screen dashboard-surface flex">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onLogout={onLogout}
      />
      <main className="flex-1">
        {renderPage()}
      </main>
    </div>
  );
};

interface DashboardHomeProps {
  onShowBusinessSetup: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onShowBusinessSetup }) => {
  const { data, currentBusiness } = useBusiness();

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
    sum + project.teamAllocations.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0), 0
  );
  const netMargin = totalProjectValue - totalTeamAllocated;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dashboard-text-primary">Dashboard</h1>
        <p className="dashboard-text-secondary">Welcome to {currentBusiness.name}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentBusiness.currentBalance, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Min: {formatCurrency(currentBusiness.minimumBalance, currentBusiness.currency)}
            </p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Team Allocations</CardTitle>
            <Users className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTeamAllocated, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Across {data.teamMembers.length} members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
            <TrendingUp className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(netMargin, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Project value - allocations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Your currently active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjects.slice(0, 5).map(project => (
                <div key={project.id} className="flex items-center justify-between p-4 dashboard-surface-elevated rounded-lg">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm dashboard-text-secondary">{project.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(project.totalValue, currentBusiness.currency)}
                    </div>
                    <div className="text-sm dashboard-text-secondary">
                      {project.teamAllocations.length} team members
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

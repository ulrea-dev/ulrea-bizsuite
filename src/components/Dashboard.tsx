
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, DollarSign, Users, FolderOpen } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { BusinessSetup } from './BusinessSetup';
import { ProjectCard } from './ProjectCard';
import { Navigation } from './Navigation';
import { ProjectsPage } from './ProjectsPage';
import { TeamPage } from './TeamPage';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { data, currentBusiness, switchBusiness } = useBusiness();
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleBusinessChange = (businessId: string) => {
    switchBusiness(businessId);
  };

  if (!currentBusiness && data.businesses.length === 0) {
    return (
      <div className="min-h-screen dashboard-background p-6">
        <div className="max-w-4xl mx-auto">
          <BusinessSetup onComplete={() => setShowBusinessSetup(false)} />
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectsPage />;
      case 'team':
        return <TeamPage />;
      case 'clients':
        return <div className="p-6"><h1>Clients - Coming Soon</h1></div>;
      case 'analytics':
        return <div className="p-6"><h1>Analytics - Coming Soon</h1></div>;
      case 'settings':
        return <div className="p-6"><h1>Settings - Coming Soon</h1></div>;
      default:
        return <DashboardContent />;
    }
  };

  const DashboardContent = () => {
    if (!currentBusiness) {
      return (
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-semibold mb-2">Select a business to get started</h2>
              <p className="text-muted-foreground">Choose a business from the dropdown above</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const currentProjects = data.projects.filter(
      project => project.businessId === currentBusiness?.id && project.status === 'active'
    );

    const totalProjectValue = currentProjects.reduce((sum, project) => sum + project.totalValue, 0);
    const totalTeamAllocated = currentProjects.reduce((sum, project) => 
      sum + project.teamAllocations.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0), 0
    );

    return (
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Business Overview */}
        <div>
          <h2 className="text-2xl font-bold dashboard-text-primary mb-2">
            {currentBusiness.name}
          </h2>
          <p className="dashboard-text-secondary">{currentBusiness.type}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(currentBusiness.currentBalance, currentBusiness.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Min: {formatCurrency(currentBusiness.minimumBalance, currentBusiness.currency)}
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentProjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Total Value: {formatCurrency(totalProjectValue, currentBusiness.currency)}
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Allocations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalTeamAllocated, currentBusiness.currency)}
              </div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalProjectValue - totalTeamAllocated, currentBusiness.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalProjectValue > 0 ? `${((totalProjectValue - totalTeamAllocated) / totalProjectValue * 100).toFixed(1)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Projects Preview */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dashboard-text-primary">Recent Projects</h3>
            <Button variant="outline" onClick={() => setCurrentPage('projects')}>
              View All Projects
            </Button>
          </div>
          
          {currentProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No active projects</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Get started by creating your first project for {currentBusiness.name}
                </p>
                <Button onClick={() => setCurrentPage('projects')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentProjects.slice(0, 3).map(project => (
                <ProjectCard key={project.id} project={project} currency={currentBusiness.currency} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen dashboard-background flex">
      {/* Navigation Sidebar */}
      <Navigation 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="dashboard-surface border-b dashboard-border px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold dashboard-text-primary">
                Welcome back, {data.userSettings.username}
              </h1>
              <p className="text-sm dashboard-text-secondary">
                {currentBusiness ? `Managing ${currentBusiness.name}` : 'Select a business to get started'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={currentBusiness?.id || ''} onValueChange={handleBusinessChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {data.businesses.map(business => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setShowBusinessSetup(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Business
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>

      {/* Business Setup Modal */}
      {showBusinessSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <BusinessSetup onComplete={() => setShowBusinessSetup(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

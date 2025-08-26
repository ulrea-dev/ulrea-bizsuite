
import React from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessSetup } from './BusinessSetup';
import { MultiBusinessOverview } from './MultiBusinessOverview';
import { formatCurrency } from '@/utils/storage';
import { TrendingUp, FolderOpen, Users, DollarSign, Handshake } from 'lucide-react';

interface DashboardHomeProps {
  onShowBusinessSetup: () => void;
  onSelectBusiness: (businessId: string) => void;
  onCreateBusiness: () => void;
  onNavigateToProject: (projectId: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ 
  onShowBusinessSetup, 
  onSelectBusiness, 
  onCreateBusiness,
  onNavigateToProject
}) => {
  const { data, currentBusiness } = useBusiness();

  if (data.businesses.length > 1 && (!currentBusiness || currentBusiness === null)) {
    return (
      <MultiBusinessOverview 
        onSelectBusiness={onSelectBusiness}
        onCreateBusiness={onCreateBusiness}
      />
    );
  }

  if (!currentBusiness) {
    return (
      <BusinessSetup onComplete={onShowBusinessSetup} />
    );
  }

  const currentProjects = data.projects.filter(project => project.businessId === currentBusiness.id);
  const activeProjects = currentProjects.filter(project => project.status === 'active');
  const totalProjectValue = currentProjects.reduce((sum, project) => sum + project.totalValue, 0);
  const totalTeamAllocated = currentProjects.reduce((sum, project) => 
    sum + (project.teamAllocations?.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0) || 0), 0
  );

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium">Team Allocations</CardTitle>
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTeamAllocated, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">Total allocated</p>
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
                      {formatCurrency(project.totalValue, currentBusiness.currency)}
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

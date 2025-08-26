
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, DollarSign, Users, FolderOpen, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { BusinessSetup } from './BusinessSetup';
import { ProjectCard } from './ProjectCard';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const { data, currentBusiness, switchBusiness } = useBusiness();
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);

  const currentProjects = data.projects.filter(
    project => project.businessId === currentBusiness?.id && project.status === 'active'
  );

  const totalProjectValue = currentProjects.reduce((sum, project) => sum + project.totalValue, 0);
  const totalTeamAllocated = currentProjects.reduce((sum, project) => 
    sum + project.teamAllocations.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0), 0
  );

  const handleBusinessChange = (businessId: string) => {
    switchBusiness(businessId);
  };

  if (!currentBusiness && data.businesses.length === 0) {
    return (
      <div className="min-h-screen dashboard-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold dashboard-text-primary">Welcome, {data.userSettings.username}!</h1>
              <p className="dashboard-text-secondary">Let's set up your first business</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          <BusinessSetup onComplete={() => setShowBusinessSetup(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-background">
      {/* Header */}
      <header className="dashboard-surface border-b dashboard-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 dashboard-surface-elevated rounded-lg border dashboard-border">
              <Building2 className="h-6 w-6 dashboard-text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold dashboard-text-primary">BizSuite</h1>
              <p className="text-sm dashboard-text-secondary">Welcome back, {data.userSettings.username}</p>
            </div>
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
            
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {currentBusiness ? (
          <div className="space-y-6 animate-fade-in">
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

            {/* Active Projects */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dashboard-text-primary">Active Projects</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
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
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentProjects.map(project => (
                    <ProjectCard key={project.id} project={project} currency={currentBusiness.currency} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Select a business to get started</h2>
            <p className="text-muted-foreground">Choose a business from the dropdown above</p>
          </div>
        )}
      </main>

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

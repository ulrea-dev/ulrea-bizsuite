import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, FolderOpen, Users, DollarSign, ArrowRight, Plus } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { Business } from '@/types/business';

interface MultiBusinessOverviewProps {
  onSelectBusiness: (businessId: string) => void;
  onCreateBusiness: () => void;
}

export const MultiBusinessOverview: React.FC<MultiBusinessOverviewProps> = ({ 
  onSelectBusiness, 
  onCreateBusiness 
}) => {
  const { data } = useBusiness();

  const getBusinessMetrics = (business: Business) => {
    const businessProjects = data.projects.filter(p => p.businessId === business.id);
    const activeProjects = businessProjects.filter(p => p.status === 'active');
    const totalProjectValue = businessProjects.reduce((sum, p) => sum + p.totalValue, 0);
    const totalAllocated = businessProjects.reduce((sum, p) => 
      sum + p.teamAllocations.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0), 0
    );
    const netMargin = totalProjectValue - totalAllocated;

    return {
      activeProjects: activeProjects.length,
      totalProjects: businessProjects.length,
      totalProjectValue,
      netMargin,
      totalAllocated,
      healthScore: business.currentBalance > business.minimumBalance ? 'good' : 'warning'
    };
  };

  const totalBalance = data.businesses.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalProjects = data.projects.length;
  const activeProjects = data.projects.filter(p => p.status === 'active').length;
  const totalTeamMembers = data.teamMembers.length;

  return (
    <div className="space-y-6">
      {/* Overall Portfolio Metrics */}
      <div>
        <h1 className="text-3xl font-bold dashboard-text-primary">Business Portfolio</h1>
        <p className="dashboard-text-secondary">Overview of all your businesses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.businesses.length > 0 && formatCurrency(totalBalance, data.businesses[0].currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Across {data.businesses.length} businesses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs dashboard-text-secondary">
              {totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-xs dashboard-text-secondary">
              Across all businesses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Businesses</CardTitle>
            <Building2 className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.businesses.length}</div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCreateBusiness}
              className="text-xs mt-1 p-0 h-auto dashboard-text-secondary hover:dashboard-text-primary"
            >
              + Add Business
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Individual Business Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Your Businesses</CardTitle>
          <CardDescription>Click on any business to view detailed dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.businesses.map(business => {
              const metrics = getBusinessMetrics(business);
              return (
                <Card 
                  key={business.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow card-hover"
                  onClick={() => onSelectBusiness(business.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 dashboard-text-secondary" />
                        <CardTitle className="text-lg">{business.name}</CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 dashboard-text-secondary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{business.type}</Badge>
                      <Badge 
                        variant={metrics.healthScore === 'good' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {metrics.healthScore === 'good' ? 'Healthy' : 'Low Balance'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="dashboard-text-secondary">Balance</div>
                        <div className="font-semibold">
                          {formatCurrency(business.currentBalance, business.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="dashboard-text-secondary">Active Projects</div>
                        <div className="font-semibold">{metrics.activeProjects}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="dashboard-text-secondary">Project Value</div>
                        <div className="font-semibold">
                          {formatCurrency(metrics.totalProjectValue, business.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="dashboard-text-secondary">Net Margin</div>
                        <div className={`font-semibold ${metrics.netMargin >= 0 ? 'status-positive' : 'status-negative'}`}>
                          {formatCurrency(metrics.netMargin, business.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t dashboard-border">
                      <div className="text-xs dashboard-text-secondary">
                        Created {new Date(business.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Business Card */}
            <Card 
              className="cursor-pointer border-dashed hover:border-solid hover:shadow-lg transition-all card-hover"
              onClick={onCreateBusiness}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
                <div className="p-4 dashboard-surface-elevated rounded-full">
                  <Plus className="h-8 w-8 dashboard-text-secondary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold dashboard-text-primary">Create New Business</h3>
                  <p className="text-sm dashboard-text-secondary">Add another business to your portfolio</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
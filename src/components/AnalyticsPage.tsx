
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, FolderOpen, UserCheck } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';

export const AnalyticsPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No Business Selected</h3>
            <p className="text-muted-foreground">Please select a business to view analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentProjects = data.projects.filter(project => project.businessId === currentBusiness.id);
  
  // Calculate metrics
  const totalProjectValue = currentProjects.reduce((sum, project) => {
    const projectValue = project.isMultiPhase && project.allocations?.length 
      ? project.allocations.reduce((allocationSum, allocation) => allocationSum + allocation.budget, 0)
      : project.totalValue;
    return sum + projectValue;
  }, 0);
  const activeProjects = currentProjects.filter(project => project.status === 'active').length;
  const completedProjects = currentProjects.filter(project => project.status === 'completed').length;
  const totalTeamAllocated = currentProjects.reduce((sum, project) => 
    sum + project.teamAllocations.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0), 0
  );
  const totalOutstanding = currentProjects.reduce((sum, project) => 
    sum + project.teamAllocations.reduce((allocSum, alloc) => allocSum + alloc.outstanding, 0), 0
  );

  // Project status data for pie chart
  const projectStatusData = [
    { name: 'Active', value: currentProjects.filter(p => p.status === 'active').length, color: 'hsl(var(--chart-1))' },
    { name: 'Completed', value: currentProjects.filter(p => p.status === 'completed').length, color: 'hsl(var(--chart-2))' },
    { name: 'On Hold', value: currentProjects.filter(p => p.status === 'on-hold').length, color: 'hsl(var(--chart-3))' },
    { name: 'Cancelled', value: currentProjects.filter(p => p.status === 'cancelled').length, color: 'hsl(var(--chart-4))' }
  ].filter(item => item.value > 0);

  // Monthly project values (mock data for demo)
  const monthlyData = [
    { month: 'Jan', value: totalProjectValue * 0.1 },
    { month: 'Feb', value: totalProjectValue * 0.15 },
    { month: 'Mar', value: totalProjectValue * 0.2 },
    { month: 'Apr', value: totalProjectValue * 0.25 },
    { month: 'May', value: totalProjectValue * 0.3 },
    { month: 'Jun', value: totalProjectValue }
  ].map(item => ({ ...item, value: Math.round(item.value) }));

  // Top projects by value
  const topProjects = currentProjects
    .map(project => {
      const projectValue = project.isMultiPhase && project.allocations?.length 
        ? project.allocations.reduce((sum, allocation) => sum + allocation.budget, 0)
        : project.totalValue;
      return { ...project, calculatedValue: projectValue };
    })
    .sort((a, b) => b.calculatedValue - a.calculatedValue)
    .slice(0, 5)
    .map(project => ({
      name: project.name,
      value: project.calculatedValue
    }));

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dashboard-text-primary">Analytics</h1>
        <p className="dashboard-text-secondary">Business insights for {currentBusiness.name}</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Project Value</CardTitle>
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalProjectValue, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Across {currentProjects.length} projects
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
              {completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <Users className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTeamAllocated, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingDown className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalOutstanding, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Pending payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        {projectStatusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project Value Trend</CardTitle>
            <CardDescription>Cumulative project values over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--color-value)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Projects */}
      {topProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Projects by Value</CardTitle>
            <CardDescription>Highest value projects in your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={topProjects} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

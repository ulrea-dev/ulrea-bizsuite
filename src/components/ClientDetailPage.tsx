
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Building, Mail, FolderOpen, DollarSign, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { calculateClientMetrics, getClientProjectsWithMetrics } from '@/utils/clientUtils';

interface ClientDetailPageProps {
  clientId: string;
  onBack: () => void;
  onNavigateToProject?: (projectId: string) => void;
}

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ 
  clientId, 
  onBack, 
  onNavigateToProject 
}) => {
  const { data, currentBusiness } = useBusiness();
  const [statusFilter, setStatusFilter] = useState('all');

  const client = data.clients.find(c => c.id === clientId);
  
  if (!client || !currentBusiness) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">Client Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested client could not be found</p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = calculateClientMetrics(client, data.projects, data.payments);
  const projectsWithMetrics = getClientProjectsWithMetrics(client, data.projects, data.payments);
  
  const filteredProjects = statusFilter === 'all' 
    ? projectsWithMetrics 
    : projectsWithMetrics.filter(project => project.status === statusFilter);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on-hold': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold dashboard-text-primary">{client.name}</h1>
          <div className="flex items-center gap-4 dashboard-text-secondary text-sm">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {client.email}
            </div>
            {client.company && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {client.company}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs dashboard-text-secondary">
              {metrics.totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalValue, currentBusiness.currency)}
            </div>
            <Progress value={metrics.paymentProgress} className="mt-2" />
            <p className="text-xs dashboard-text-secondary mt-1">
              {metrics.paymentProgress.toFixed(1)}% paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.netProfit, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              After allocations & expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.outstandingPayments, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">
              Pending payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="financial">Financial Summary</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Client Projects</h3>
            <div className="flex gap-2">
              {['all', 'active', 'completed', 'on-hold', 'cancelled'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Net Profit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm dashboard-text-secondary">
                            {project.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(project.totalValue, currentBusiness.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={project.paymentProgress} className="w-20" />
                          <div className="text-xs dashboard-text-secondary">
                            {project.paymentProgress.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={project.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(project.netProfit, currentBusiness.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateToProject?.(project.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Contract Value</span>
                  <span className="font-medium">
                    {formatCurrency(metrics.totalValue, currentBusiness.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payments Received</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(metrics.totalPaymentsReceived, currentBusiness.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(metrics.outstandingPayments, currentBusiness.currency)}
                  </span>
                </div>
                <Progress value={metrics.paymentProgress} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Allocated</span>
                  <span className="font-medium">
                    {formatCurrency(metrics.totalAllocated, currentBusiness.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses</span>
                  <span className="font-medium">
                    {formatCurrency(metrics.totalExpenses, currentBusiness.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Net Profit</span>
                  <span className={`font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metrics.netProfit, currentBusiness.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Client Name</label>
                  <p className="text-sm dashboard-text-secondary">{client.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm dashboard-text-secondary">{client.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <p className="text-sm dashboard-text-secondary">{client.company || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Client Since</label>
                  <p className="text-sm dashboard-text-secondary">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

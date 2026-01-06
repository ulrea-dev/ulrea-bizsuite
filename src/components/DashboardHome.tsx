import React from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessSetup } from './BusinessSetup';
import { MultiBusinessOverview } from './MultiBusinessOverview';
import { formatCurrency } from '@/utils/storage';
import { Briefcase, Users, DollarSign, Handshake, FolderKanban, ListChecks, Repeat, ArrowRight, AlertCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRenewalReminders } from '@/hooks/useRenewalReminders';

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
  const navigate = useNavigate();
  const { 
    totalDueSoon, 
    overdueCount, 
    urgentCount, 
    shouldShowReminder, 
    dismissReminder 
  } = useRenewalReminders();

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

  // Quick tasks
  const currentQuickTasks = data.quickTasks?.filter(task => task.businessId === currentBusiness.id) || [];
  const activeQuickTasks = currentQuickTasks.filter(task => task.status === 'active' || task.status === 'pending');

  // Retainers
  const currentRetainers = data.retainers?.filter(retainer => retainer.businessId === currentBusiness.id) || [];
  const activeRetainers = currentRetainers.filter(retainer => retainer.status === 'active');
  const retainerMRR = activeRetainers.reduce((sum, retainer) => sum + retainer.amount, 0);

  // Recent works - combine and sort by most recent
  const recentWorks = [
    ...activeProjects.map(p => ({ 
      type: 'project' as const, 
      id: p.id, 
      name: p.name, 
      description: p.description,
      value: p.totalValue,
      date: p.updatedAt || p.createdAt,
      status: p.status
    })),
    ...activeQuickTasks.slice(0, 5).map(t => ({ 
      type: 'task' as const, 
      id: t.id, 
      name: t.title, 
      description: t.description || '',
      value: t.amount,
      date: t.updatedAt || t.createdAt,
      status: t.status
    })),
    ...activeRetainers.slice(0, 5).map(r => ({ 
      type: 'retainer' as const, 
      id: r.id, 
      name: r.name, 
      description: `${formatCurrency(r.amount, currentBusiness.currency)}/${r.frequency}`,
      value: r.amount,
      date: r.updatedAt || r.createdAt,
      status: r.status
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  const getWorkIcon = (type: 'project' | 'task' | 'retainer') => {
    switch (type) {
      case 'project': return <FolderKanban className="h-4 w-4" />;
      case 'task': return <ListChecks className="h-4 w-4" />;
      case 'retainer': return <Repeat className="h-4 w-4" />;
    }
  };

  const getWorkBadge = (type: 'project' | 'task' | 'retainer') => {
    switch (type) {
      case 'project': return <Badge variant="secondary" className="text-xs">Project</Badge>;
      case 'task': return <Badge variant="outline" className="text-xs">Task</Badge>;
      case 'retainer': return <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">Retainer</Badge>;
    }
  };

  const handleWorkClick = (work: typeof recentWorks[0]) => {
    switch (work.type) {
      case 'project':
        onNavigateToProject(work.id);
        break;
      case 'task':
        navigate('/works?tab=quick-tasks');
        break;
      case 'retainer':
        navigate(`/works/retainers/${work.id}`);
        break;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold dashboard-text-primary">Dashboard</h1>
        <p className="text-xs sm:text-sm dashboard-text-secondary">Welcome to {currentBusiness.name}</p>
      </div>

      {/* Renewal Reminder Banner */}
      {shouldShowReminder && (
        <Alert variant={overdueCount > 0 ? "destructive" : "default"} className="relative">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {totalDueSoon} renewal{totalDueSoon !== 1 ? 's' : ''} due soon
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {overdueCount > 0 && `${overdueCount} overdue`}
              {overdueCount > 0 && urgentCount > 0 && ', '}
              {urgentCount > 0 && `${urgentCount} due within 7 days`}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/works/renewals')}
              className="ml-4"
            >
              View Renewals
            </Button>
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 h-6 w-6 p-0" 
            onClick={dismissReminder}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Works</CardTitle>
            <Briefcase className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">{activeProjects.length + activeQuickTasks.length + activeRetainers.length}</div>
            <p className="text-xs dashboard-text-secondary truncate">
              {activeProjects.length} projects, {activeQuickTasks.length} tasks, {activeRetainers.length} retainers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">{data.teamMembers?.length || 0}</div>
            <p className="text-xs dashboard-text-secondary">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retainer MRR</CardTitle>
            <Repeat className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold truncate">
              {formatCurrency(retainerMRR, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">{activeRetainers.length} active retainers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Budget</CardTitle>
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold truncate">
              {formatCurrency(totalTeamAllocated, currentBusiness.currency)}
            </div>
            <p className="text-xs dashboard-text-secondary">Assigned</p>
          </CardContent>
        </Card>
      </div>

      {recentWorks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Works</CardTitle>
              <CardDescription>Your latest projects, tasks, and retainers</CardDescription>
            </div>
            <button 
              onClick={() => navigate('/works')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWorks.map(work => (
                <div 
                  key={`${work.type}-${work.id}`} 
                  className="flex items-center justify-between p-3 sm:p-4 dashboard-surface-elevated rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleWorkClick(work)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-md bg-muted">
                      {getWorkIcon(work.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{work.name}</h4>
                        {getWorkBadge(work.type)}
                      </div>
                      <p className="text-sm dashboard-text-secondary truncate">{work.description}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="font-semibold">
                      {formatCurrency(work.value, currentBusiness.currency)}
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

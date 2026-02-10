import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { useTodoReminders } from '@/hooks/useTodoReminders';
import { Briefcase, Settings2, ListTodo, ArrowRight, FolderKanban, Users, Wallet, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const WorkOSHub: React.FC = () => {
  const navigate = useNavigate();
  const { data, currentBusiness } = useBusiness();
  const { overdueCount, dueTodayCount, totalUrgent } = useTodoReminders();

  // Operations stats
  const activeProjects = currentBusiness 
    ? data.projects.filter(p => p.businessId === currentBusiness.id && p.status === 'active').length
    : data.projects.filter(p => p.status === 'active').length;
  const activeQuickTasks = currentBusiness
    ? (data.quickTasks?.filter(t => t.businessId === currentBusiness.id && (t.status === 'active' || t.status === 'pending')).length || 0)
    : (data.quickTasks?.filter(t => t.status === 'active' || t.status === 'pending').length || 0);
  const activeRetainers = currentBusiness
    ? (data.retainers?.filter(r => r.businessId === currentBusiness.id && r.status === 'active').length || 0)
    : (data.retainers?.filter(r => r.status === 'active').length || 0);

  // Back Office stats
  const teamCount = data.teamMembers?.length || 0;
  const partnerCount = data.partners?.length || 0;
  const businessCount = data.businesses.length;

  const areas = [
    {
      id: 'operations',
      title: 'Operations',
      description: 'Projects, clients, finances & analytics',
      icon: Briefcase,
      path: '/dashboard',
      onClick: () => navigate(currentBusiness ? '/works/projects' : '/dashboard'),
      stats: [
        { label: 'Active Projects', value: activeProjects, icon: FolderKanban },
        { label: 'Quick Tasks', value: activeQuickTasks },
        { label: 'Retainers', value: activeRetainers },
      ],
      color: 'bg-primary/10 text-primary border-primary/20',
      iconColor: 'text-primary',
    },
    {
      id: 'back-office',
      title: 'Back Office',
      description: 'Team, partners, bank accounts & settings',
      icon: Settings2,
      path: '/business-management',
      onClick: () => navigate('/business-management'),
      stats: [
        { label: 'Businesses', value: businessCount },
        { label: 'Team Members', value: teamCount, icon: Users },
        { label: 'Partners', value: partnerCount },
      ],
      color: 'bg-secondary text-secondary-foreground border-border',
      iconColor: 'text-secondary-foreground',
    },
    {
      id: 'todo',
      title: 'To-Do',
      description: 'Tasks, reminders & daily planning',
      icon: ListTodo,
      path: '/todos',
      onClick: () => navigate('/todos'),
      stats: [
        { label: 'Due Today', value: dueTodayCount },
        { label: 'Overdue', value: overdueCount, urgent: true },
      ],
      color: 'bg-accent text-accent-foreground border-border',
      iconColor: 'text-accent-foreground',
      badge: totalUrgent > 0 ? totalUrgent : undefined,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
          {currentBusiness ? `Welcome to ${currentBusiness.name}` : 'Your Workspace'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose where you want to go
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {areas.map((area) => {
          const Icon = area.icon;
          return (
            <Card
              key={area.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] group relative overflow-hidden"
              onClick={area.onClick}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-lg border ${area.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {area.badge && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {area.badge}
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-foreground mb-1">{area.title}</h2>
                <p className="text-xs text-muted-foreground mb-4">{area.description}</p>

                <div className="space-y-1.5">
                  {area.stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className={`font-medium ${stat.urgent && stat.value > 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-xs text-primary mt-4 group-hover:translate-x-1 transition-transform">
                  Open {area.title} <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

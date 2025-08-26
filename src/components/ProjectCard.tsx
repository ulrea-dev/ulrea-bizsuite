
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, Users } from 'lucide-react';
import { Project, Currency } from '@/types/business';
import { formatCurrency } from '@/utils/storage';

interface ProjectCardProps {
  project: Project;
  currency: Currency;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, currency }) => {
  const totalAllocated = project.teamAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
  const totalPaid = project.teamAllocations.reduce((sum, alloc) => sum + alloc.paidAmount, 0);
  const paymentProgress = totalAllocated > 0 ? (totalPaid / totalAllocated) * 100 : 0;
  
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-status-positive text-white';
      case 'completed': return 'bg-status-positive text-white';
      case 'on-hold': return 'bg-status-neutral text-white';
      case 'cancelled': return 'bg-status-negative text-white';
      default: return 'bg-status-neutral text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="card-hover animate-slide-in-right">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg dashboard-text-primary truncate">
              {project.name}
            </CardTitle>
            <CardDescription className="dashboard-text-secondary">
              {project.description}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Project Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 dashboard-text-secondary" />
            <span className="text-sm dashboard-text-secondary">Total Value</span>
          </div>
          <span className="font-semibold dashboard-text-primary">
            {formatCurrency(project.totalValue, currency)}
          </span>
        </div>
        
        {/* Team Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 dashboard-text-secondary" />
            <span className="text-sm dashboard-text-secondary">Team Members</span>
          </div>
          <span className="font-medium dashboard-text-primary">
            {project.teamAllocations.length}
          </span>
        </div>
        
        {/* Payment Progress */}
        {project.teamAllocations.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="dashboard-text-secondary">Payment Progress</span>
              <span className="dashboard-text-primary">
                {formatCurrency(totalPaid, currency)} / {formatCurrency(totalAllocated, currency)}
              </span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>
        )}
        
        {/* Timeline */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 dashboard-text-secondary" />
            <span className="dashboard-text-secondary">Started</span>
          </div>
          <span className="dashboard-text-primary">
            {formatDate(project.startDate)}
          </span>
        </div>
        
        {project.endDate && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 dashboard-text-secondary" />
              <span className="dashboard-text-secondary">
                {project.status === 'completed' ? 'Completed' : 'Due'}
              </span>
            </div>
            <span className="dashboard-text-primary">
              {formatDate(project.endDate)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

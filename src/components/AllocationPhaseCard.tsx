import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, Calendar, DollarSign, Users, Building } from 'lucide-react';
import { format } from 'date-fns';
import { ProjectAllocation, Project, Business } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { AllocationPhaseModal } from './AllocationPhaseModal';
import { AllocationDetailModal } from './AllocationDetailModal';

interface AllocationPhaseCardProps {
  allocation: ProjectAllocation;
  project: Project;
  currentBusiness: Business;
}

export const AllocationPhaseCard: React.FC<AllocationPhaseCardProps> = ({ allocation, project, currentBusiness }) => {
  const { dispatch } = useBusiness();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'active': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'completed': return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
      case 'on-hold': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'on-hold': return 'On Hold';
      default: return status;
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this allocation? This will also remove all associated allocations and payments.')) {
      dispatch({
        type: 'DELETE_ALLOCATION',
        payload: { projectId: project.id, allocationId: allocation.id },
      });
    }
  };

  // Calculate allocation allocations and spending
  const allocationTeamAllocations = project.allocationTeamAllocations?.filter(a => a.allocationId === allocation.id) || [];
  const allocationPartnerAllocations = project.allocationPartnerAllocations?.filter(a => a.allocationId === allocation.id) || [];
  const allocationCompanyAllocation = project.allocationCompanyAllocations?.find(a => a.allocationId === allocation.id);

  const totalAllocated = [
    ...allocationTeamAllocations.map(a => a.totalAllocated),
    ...allocationPartnerAllocations.map(a => a.totalAllocated),
    ...(allocationCompanyAllocation ? [allocationCompanyAllocation.totalAllocated] : [])
  ].reduce((sum, amount) => sum + amount, 0);

  const budgetProgress = allocation.budget > 0 ? (totalAllocated / allocation.budget) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{allocation.title}</CardTitle>
            <Badge className={getStatusColor(allocation.status)}>
              {getStatusLabel(allocation.status)}
            </Badge>
          </div>
          <div className="flex space-x-1">
            <AllocationPhaseModal projectId={project.id} allocation={allocation}>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </AllocationPhaseModal>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {allocation.description && (
          <p className="text-sm text-muted-foreground">{allocation.description}</p>
        )}

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {format(new Date(allocation.startDate), 'MMM dd, yyyy')}
            {allocation.endDate && (
              <>
                <span className="mx-1">-</span>
                {format(new Date(allocation.endDate), 'MMM dd, yyyy')}
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">Budget</span>
            </div>
            <span className="text-sm font-mono">
              {currentBusiness.currency.symbol}{allocation.budget.toLocaleString()}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Allocated: {currentBusiness.currency.symbol}{totalAllocated.toLocaleString()}</span>
              <span>{budgetProgress.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(budgetProgress, 100)} className="h-2" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex space-x-4 text-xs text-muted-foreground">
            {allocationTeamAllocations.length > 0 && (
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {allocationTeamAllocations.length} team
              </div>
            )}
            {allocationPartnerAllocations.length > 0 && (
              <div className="flex items-center">
                <Building className="w-3 h-3 mr-1" />
                Partners allocated
              </div>
            )}
          </div>
          
          <AllocationDetailModal projectId={project.id} allocation={allocation}>
            <Button variant="outline" size="sm">
              Manage Allocations
            </Button>
          </AllocationDetailModal>
        </div>
      </CardContent>
    </Card>
  );
};
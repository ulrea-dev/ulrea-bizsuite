import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, Calendar, DollarSign, Users, Building } from 'lucide-react';
import { format } from 'date-fns';
import { ProjectPhase, Project, Business } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { PhaseModal } from './PhaseModal';
import { PhaseAllocationModal } from './PhaseAllocationModal';

interface PhaseCardProps {
  phase: ProjectPhase;
  project: Project;
  currentBusiness: Business;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase, project, currentBusiness }) => {
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
    if (window.confirm('Are you sure you want to delete this phase? This will also remove all associated allocations and payments.')) {
      dispatch({
        type: 'DELETE_PHASE',
        payload: { projectId: project.id, phaseId: phase.id },
      });
    }
  };

  // Calculate phase allocations and spending
  const phaseTeamAllocations = project.phaseTeamAllocations?.filter(a => a.phaseId === phase.id) || [];
  const phasePartnerAllocations = project.phasePartnerAllocations?.filter(a => a.phaseId === phase.id) || [];
  const phaseCompanyAllocation = project.phaseCompanyAllocations?.find(a => a.phaseId === phase.id);

  const totalAllocated = [
    ...phaseTeamAllocations.map(a => a.totalAllocated),
    ...phasePartnerAllocations.map(a => a.totalAllocated),
    ...(phaseCompanyAllocation ? [phaseCompanyAllocation.totalAllocated] : [])
  ].reduce((sum, amount) => sum + amount, 0);

  const budgetProgress = phase.budget > 0 ? (totalAllocated / phase.budget) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{phase.title}</CardTitle>
            <Badge className={getStatusColor(phase.status)}>
              {getStatusLabel(phase.status)}
            </Badge>
          </div>
          <div className="flex space-x-1">
            <PhaseModal projectId={project.id} phase={phase}>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </PhaseModal>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase.description && (
          <p className="text-sm text-muted-foreground">{phase.description}</p>
        )}

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {format(new Date(phase.startDate), 'MMM dd, yyyy')}
            {phase.endDate && (
              <>
                <span className="mx-1">-</span>
                {format(new Date(phase.endDate), 'MMM dd, yyyy')}
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
              {currentBusiness.currency.symbol}{phase.budget.toLocaleString()}
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

        <div className="flex items-center justify-between">
          <div className="flex space-x-4 text-xs text-muted-foreground">
            {phaseTeamAllocations.length > 0 && (
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {phaseTeamAllocations.length} team
              </div>
            )}
            {phasePartnerAllocations.length > 0 && (
              <div className="flex items-center">
                <Building className="w-3 h-3 mr-1" />
                {phasePartnerAllocations.length} partners
              </div>
            )}
          </div>
          
          <PhaseAllocationModal projectId={project.id} phase={phase}>
            <Button variant="outline" size="sm">
              Manage Allocations
            </Button>
          </PhaseAllocationModal>
        </div>
      </CardContent>
    </Card>
  );
};
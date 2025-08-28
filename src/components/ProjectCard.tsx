
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, User, Building2 } from 'lucide-react';
import { Project, Currency } from '@/types/business';
import { formatCurrency } from '@/utils/storage';

interface ProjectCardProps {
  project: Project;
  currency: Currency;
  onNavigateToClient?: (clientId: string) => void;
  onNavigateToTeam?: () => void;
  onNavigateToProject?: (projectId: string) => void;
  clientName?: string;
  teamMembers?: Array<{ id: string; name: string }>;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  currency, 
  onNavigateToClient, 
  onNavigateToTeam,
  onNavigateToProject,
  clientName,
  teamMembers 
}) => {
  // Calculate total project value from allocations if using multiple phases, otherwise use totalValue
  const totalProjectValue = project.isMultiPhase && project.allocations?.length 
    ? project.allocations.reduce((sum, allocation) => sum + allocation.budget, 0)
    : project.totalValue;

  // Use allocation-based allocations if project uses multiple phases, otherwise use regular allocations
  const totalTeamAllocated = project.isMultiPhase 
    ? (project.allocationTeamAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0)
    : project.teamAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
  const totalPartnerAllocated = project.isMultiPhase 
    ? (project.allocationPartnerAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0)
    : (project.partnerAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0);
  const companyAllocated = project.isMultiPhase 
    ? (project.allocationCompanyAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0)
    : (project.companyAllocation?.totalAllocated || 0);
  
  const totalAllocated = totalTeamAllocated + totalPartnerAllocated + companyAllocated;
  const totalPaid = project.teamAllocations.reduce((sum, alloc) => sum + alloc.paidAmount, 0);
  const paymentProgress = totalAllocated > 0 ? (totalPaid / totalAllocated) * 100 : 0;

  // Fix team member counting and deduplication
  const getUniqueTeamMembers = () => {
    if (teamMembers && teamMembers.length > 0) {
      // Use provided teamMembers but deduplicate by ID
      const uniqueMembers = teamMembers.reduce((acc, member) => {
        if (!acc.find(existing => existing.id === member.id)) {
          acc.push(member);
        }
        return acc;
      }, [] as Array<{ id: string; name: string }>);
      return uniqueMembers;
    }

    // Fallback to extracting from project allocations
    if (project.isMultiPhase && project.allocationTeamAllocations) {
      const uniqueMembers = project.allocationTeamAllocations.reduce((acc, alloc) => {
        if (!acc.find(existing => existing.id === alloc.memberId)) {
          acc.push({ id: alloc.memberId, name: alloc.memberName });
        }
        return acc;
      }, [] as Array<{ id: string; name: string }>);
      return uniqueMembers;
    }

    // Legacy team allocations
    return project.teamAllocations?.map(alloc => ({
      id: alloc.memberId,
      name: alloc.memberName
    })) || [];
  };

  const uniqueTeamMembers = getUniqueTeamMembers();
  const teamMemberCount = uniqueTeamMembers.length;
  
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-status-positive text-primary-foreground';
      case 'completed': return 'bg-status-positive text-primary-foreground';
      case 'on-hold': return 'bg-status-neutral text-primary-foreground';
      case 'cancelled': return 'bg-status-negative text-primary-foreground';
      default: return 'bg-status-neutral text-primary-foreground';
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
    <Card 
      className="card-hover animate-slide-in-right cursor-pointer transition-transform hover:scale-[1.02]" 
      onClick={() => onNavigateToProject?.(project.id)}
    >
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
            {formatCurrency(totalProjectValue, currency)}
          </span>
        </div>
        
        {/* Client Information */}
        {clientName && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 dashboard-text-secondary" />
              <span className="text-sm dashboard-text-secondary">Client</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 font-medium dashboard-text-primary hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToClient?.(project.clientId!);
              }}
            >
              {clientName}
            </Button>
          </div>
        )}
        
        {/* Team Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 dashboard-text-secondary" />
              <span className="text-sm dashboard-text-secondary">Team Members</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 font-medium dashboard-text-primary hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToTeam?.();
              }}
            >
              {teamMemberCount} members
            </Button>
          </div>
          
          {/* Team Member Names */}
          {uniqueTeamMembers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {uniqueTeamMembers.slice(0, 3).map((member) => (
                <Badge key={`team-${member.id}`} variant="secondary" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {member.name}
                </Badge>
              ))}
              {uniqueTeamMembers.length > 3 && (
                <Badge key="more-members" variant="outline" className="text-xs">
                  +{uniqueTeamMembers.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Payment Progress */}
        {teamMemberCount > 0 && (
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

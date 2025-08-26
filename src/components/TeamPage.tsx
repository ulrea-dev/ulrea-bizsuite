
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Mail, DollarSign } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { TeamMemberModal } from './TeamMemberModal';
import { formatCurrency } from '@/utils/storage';
import { TeamMember } from '@/types/business';

interface TeamPageProps {
  onNavigateToPage?: (page: string) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({ onNavigateToPage }) => {
  const { data, currentBusiness } = useBusiness();
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = data.teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateMember = () => {
    setSelectedMember(null);
    setModalMode('create');
    setShowMemberModal(true);
  };

  const handleViewMember = (member: TeamMember) => {
    setSelectedMember(member);
    setModalMode('view');
    setShowMemberModal(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setModalMode('edit');
    setShowMemberModal(true);
  };

  // Calculate member allocations across projects
  const getMemberAllocations = (memberId: string) => {
    const phaseAllocations = data.projects
      .filter(project => project.businessId === currentBusiness?.id)
      .flatMap(project => 
        project.allocationTeamAllocations?.filter(alloc => alloc.memberId === memberId) || []
      );
    
    const legacyAllocations = data.projects
      .filter(project => project.businessId === currentBusiness?.id)
      .flatMap(project => 
        project.teamAllocations.filter(alloc => alloc.memberId === memberId)
      );
    
    const allAllocations = [...phaseAllocations, ...legacyAllocations];
    const totalAllocated = allAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
    const totalPaid = allAllocations.reduce((sum, alloc) => sum + alloc.paidAmount, 0);
    const outstanding = totalAllocated - totalPaid;
    
    return { totalAllocated, totalPaid, outstanding };
  };

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No Business Selected</h3>
            <p className="text-muted-foreground">Please select a business to manage team members</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dashboard-text-primary">Team Members</h1>
          <p className="dashboard-text-secondary">Manage your team for {currentBusiness.name}</p>
        </div>
        <Button onClick={handleCreateMember}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 dashboard-text-secondary" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 dashboard-surface-elevated rounded-full mb-4">
              <Plus className="h-8 w-8 dashboard-text-secondary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Team Members Found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm 
                ? 'No team members match your search'
                : 'Add your first team member to get started'
              }
            </p>
            <Button onClick={handleCreateMember}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
            <CardDescription>
              Manage team members and track their project allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Default Rate</TableHead>
                  <TableHead>Projects & Allocations</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredMembers.map(member => {
                    const allocations = getMemberAllocations(member.id);
                    const memberProjects = data.projects
                      .filter(project => project.businessId === currentBusiness?.id)
                      .filter(project => 
                        project.teamAllocations.some(alloc => alloc.memberId === member.id) ||
                        project.allocationTeamAllocations?.some(alloc => alloc.memberId === member.id)
                      );
                    
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="flex items-center gap-1 text-sm dashboard-text-secondary">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="dashboard-text-secondary">-</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{formatCurrency(allocations.totalAllocated, currentBusiness.currency)}</div>
                            {memberProjects.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {memberProjects.slice(0, 2).map(project => (
                                  <Button
                                    key={project.id}
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-xs hover:text-primary"
                                    onClick={() => onNavigateToPage?.('projects')}
                                  >
                                    {project.name}
                                  </Button>
                                ))}
                                {memberProjects.length > 2 && (
                                  <span className="text-xs dashboard-text-secondary">
                                    +{memberProjects.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={allocations.outstanding > 0 ? 'text-orange-600' : 'dashboard-text-secondary'}>
                            {formatCurrency(allocations.outstanding, currentBusiness.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewMember(member)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMember(member)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <TeamMemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        member={selectedMember}
        mode={modalMode}
      />
    </div>
  );
};

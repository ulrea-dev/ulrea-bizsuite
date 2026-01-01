
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Eye, Edit, Mail, DollarSign, History, CreditCard } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { TeamMemberModal } from './TeamMemberModal';
import { TeamMemberPaymentHistoryModal } from './TeamMemberPaymentHistoryModal';
import { BulkTeamPaymentModal } from './BulkTeamPaymentModal';
import { formatCurrency } from '@/utils/storage';
import { TeamMember, SUPPORTED_CURRENCIES } from '@/types/business';
import { convertCurrency } from '@/utils/currencyConversion';

interface TeamPageProps {
  onNavigateToPage?: (page: string) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({ onNavigateToPage }) => {
  const { data, currentBusiness } = useBusiness();
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState<'all' | 'employee' | 'contractor'>('all');
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistoryMember, setPaymentHistoryMember] = useState<TeamMember | null>(null);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);

  const handleViewPaymentHistory = (member: TeamMember) => {
    setPaymentHistoryMember(member);
    setShowPaymentHistoryModal(true);
  };

  const filteredMembers = data.teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const memberTypeValue = member.memberType || 'employee';
    const matchesType = memberTypeFilter === 'all' || memberTypeValue === memberTypeFilter;
    
    return matchesSearch && matchesType;
  });

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

  // Calculate project allocation totals and outstanding (ONLY phase-based allocationTeamAllocations)
  const getMemberAllocations = (memberId: string) => {
    if (!currentBusiness) {
      return { totalAllocated: 0, totalPaid: 0, projectOutstanding: 0, totalOutstanding: 0 };
    }
    
    // ONLY use phase-based allocationTeamAllocations - these are the source of truth
    // Legacy teamAllocations are deprecated and should not contribute to outstanding
    const phaseAllocations = data.projects
      .filter(project => project.businessId === currentBusiness.id)
      .flatMap(project => 
        project.allocationTeamAllocations?.filter(alloc => alloc.memberId === memberId) || []
      );
    
    const totalAllocated = phaseAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
    const totalPaid = phaseAllocations.reduce((sum, alloc) => sum + alloc.paidAmount, 0);
    const projectOutstanding = totalAllocated - totalPaid;
    
    // Only project allocations contribute to outstanding
    // Salary and tasks have their own tracking systems (Payroll, Quick Tasks pages)
    const totalOutstanding = projectOutstanding;
    
    return { 
      totalAllocated, 
      totalPaid, 
      projectOutstanding,
      totalOutstanding 
    };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold dashboard-text-primary">Team</h1>
          <p className="text-sm sm:text-base dashboard-text-secondary">Manage employees and contractors</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowBulkPaymentModal(true)} size="sm" className="flex-1 sm:flex-initial">
            <CreditCard className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Bulk Pay</span>
          </Button>
          <Button onClick={handleCreateMember} size="sm" className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Team Member</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 dashboard-text-secondary" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={memberTypeFilter} onValueChange={(v) => setMemberTypeFilter(v as 'all' | 'employee' | 'contractor')}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-initial text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="employee" className="flex-1 sm:flex-initial text-xs sm:text-sm">Employees</TabsTrigger>
            <TabsTrigger value="contractor" className="flex-1 sm:flex-initial text-xs sm:text-sm">Contractors</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 dashboard-surface-elevated rounded-full mb-4">
              <Plus className="h-8 w-8 dashboard-text-secondary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Team Members Yet</h3>
            <p className="text-muted-foreground text-center mb-2 max-w-md">
              {searchTerm 
                ? 'No team members match your search'
                : 'Add employees and contractors to assign them to projects and manage their payments.'
              }
            </p>
            <Button onClick={handleCreateMember} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First Team Member
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
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Businesses</TableHead>
                  <TableHead>Projects & Allocations</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredMembers.map(member => {
                     const allocations = getMemberAllocations(member.id);
                    const memberProjects = currentBusiness 
                      ? data.projects
                          .filter(project => project.businessId === currentBusiness.id)
                          .filter(project => 
                            project.teamAllocations.some(alloc => alloc.memberId === member.id) ||
                            project.allocationTeamAllocations?.some(alloc => alloc.memberId === member.id)
                          )
                      : [];
                    
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
                          <Badge variant={(member.memberType || 'employee') === 'employee' ? 'default' : 'secondary'}>
                            {(member.memberType || 'employee') === 'employee' ? 'Employee' : 'Contractor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(!member.businessIds || member.businessIds.length === 0) ? (
                              <span className="text-sm dashboard-text-secondary">No businesses</span>
                            ) : (
                              member.businessIds.map(businessId => {
                                const business = data.businesses.find(b => b.id === businessId);
                                return business ? (
                                  <Badge key={businessId} variant="outline" className="text-xs">
                                    {business.name}
                                  </Badge>
                                ) : null;
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{currentBusiness ? formatCurrency(allocations.totalAllocated, currentBusiness.currency) : '-'}</div>
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
                          <div>
                            <span className={allocations.totalOutstanding > 0 ? 'text-orange-600 font-medium' : 'dashboard-text-secondary'}>
                              {currentBusiness ? formatCurrency(allocations.totalOutstanding, currentBusiness.currency) : '-'}
                            </span>
                            {allocations.projectOutstanding > 0 && (
                              <div className="text-xs dashboard-text-secondary mt-1">
                                Projects: {formatCurrency(allocations.projectOutstanding, currentBusiness!.currency)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewMember(member)}
                              title="View"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMember(member)}
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPaymentHistory(member)}
                              title="Payment History"
                            >
                              <History className="h-3 w-3" />
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

      <TeamMemberPaymentHistoryModal
        isOpen={showPaymentHistoryModal}
        onClose={() => setShowPaymentHistoryModal(false)}
        member={paymentHistoryMember}
      />

      <BulkTeamPaymentModal
        isOpen={showBulkPaymentModal}
        onClose={() => setShowBulkPaymentModal(false)}
      />
    </div>
  );
};

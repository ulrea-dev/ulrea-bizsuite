import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Mail, Eye, Edit, Users, Building2, Search, Trash2, History } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { TeamMemberModal } from '@/components/TeamMemberModal';
import { TeamMemberPaymentHistoryModal } from '@/components/TeamMemberPaymentHistoryModal';
import { TeamMember } from '@/types/business';
import { formatCurrency } from '@/utils/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export const TeamMembersPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBusiness, setFilterBusiness] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false);
  const [paymentHistoryMember, setPaymentHistoryMember] = useState<TeamMember | null>(null);

  const allMembers = data.teamMembers || [];
  const businesses = data.businesses || [];
  const projects = data.projects || [];

  // Filter team members
  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBusiness = filterBusiness === 'all' || 
                            member.businessIds?.includes(filterBusiness) ||
                            (!member.businessIds?.length && filterBusiness === 'all');
    const matchesType = filterType === 'all' || (member.memberType || 'employee') === filterType;
    return matchesSearch && matchesBusiness && matchesType;
  });

  const openModal = (mode: 'create' | 'edit' | 'view', member?: TeamMember) => {
    setModalMode(mode);
    setSelectedMember(member || null);
    setModalOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      dispatch({ type: 'DELETE_TEAM_MEMBER', payload: memberToDelete.id });
      toast({
        title: "Team member deleted",
        description: `${memberToDelete.name} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleViewPaymentHistory = (member: TeamMember) => {
    setPaymentHistoryMember(member);
    setPaymentHistoryModalOpen(true);
  };

  // Get member's total allocated from all projects
  const getMemberTotalAllocated = (memberId: string) => {
    return projects.reduce((total, project) => {
      const phaseAllocations = project.allocationTeamAllocations?.filter(a => a.memberId === memberId) || [];
      return total + phaseAllocations.reduce((sum, a) => sum + (a.totalAllocated || 0), 0);
    }, 0);
  };

  // Get member's total paid from all projects
  const getMemberTotalPaid = (memberId: string) => {
    return projects.reduce((total, project) => {
      const phaseAllocations = project.allocationTeamAllocations?.filter(a => a.memberId === memberId) || [];
      return total + phaseAllocations.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
    }, 0);
  };

  // Get member's outstanding from all projects
  const getMemberOutstanding = (memberId: string) => {
    const allocated = getMemberTotalAllocated(memberId);
    const paid = getMemberTotalPaid(memberId);
    return allocated - paid;
  };

  // Get business names for a member
  const getMemberBusinessNames = (member: TeamMember) => {
    if (!member.businessIds || member.businessIds.length === 0) {
      return 'No businesses';
    }
    return member.businessIds
      .map(id => businesses.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  // Get project count for a member
  const getMemberProjectCount = (memberId: string) => {
    return projects.filter(project => 
      project.teamAllocations?.some(alloc => alloc.memberId === memberId) ||
      project.allocationTeamAllocations?.some(alloc => alloc.memberId === memberId)
    ).length;
  };

  // Calculate totals
  const totalMembers = filteredMembers.length;
  const totalAllocated = filteredMembers.reduce((sum, m) => sum + getMemberTotalAllocated(m.id), 0);
  const totalPaid = filteredMembers.reduce((sum, m) => sum + getMemberTotalPaid(m.id), 0);
  const totalOutstanding = filteredMembers.reduce((sum, m) => sum + getMemberOutstanding(m.id), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold dashboard-text-primary">Team Members Management</h1>
          <p className="text-xs sm:text-sm dashboard-text-secondary">Manage all team members across businesses</p>
        </div>
        <Button onClick={() => openModal('create')} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold dashboard-text-primary">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold dashboard-text-primary">
              {currentBusiness ? formatCurrency(totalAllocated, currentBusiness.currency) : `$${totalAllocated.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {currentBusiness ? formatCurrency(totalPaid, currentBusiness.currency) : `$${totalPaid.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {currentBusiness ? formatCurrency(totalOutstanding, currentBusiness.currency) : `$${totalOutstanding.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterBusiness} onValueChange={setFilterBusiness}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Businesses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            {businesses.map(business => (
              <SelectItem key={business.id} value={business.id}>{business.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members List */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 dashboard-text-secondary mb-4" />
            <h3 className="text-lg font-semibold dashboard-text-primary mb-2">No team members found</h3>
            <p className="dashboard-text-secondary text-center mb-4">
              {searchQuery || filterBusiness !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first team member to start tracking their allocations.'}
            </p>
            {!searchQuery && filterBusiness === 'all' && filterType === 'all' && (
              <Button onClick={() => openModal('create')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile Card View
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const totalAllocatedAmount = getMemberTotalAllocated(member.id);
            const totalPaidAmount = getMemberTotalPaid(member.id);
            const outstanding = getMemberOutstanding(member.id);
            const businessNames = getMemberBusinessNames(member);
            const projectCount = getMemberProjectCount(member.id);

            return (
              <Card key={member.id} className="dashboard-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium dashboard-text-primary">{member.name}</h4>
                      <p className="text-sm dashboard-text-secondary flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </p>
                    </div>
                    <Badge variant={(member.memberType || 'employee') === 'employee' ? 'default' : 'secondary'}>
                      {(member.memberType || 'employee') === 'employee' ? 'Employee' : 'Contractor'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs dashboard-text-secondary mb-2">
                    <Badge variant="outline">{member.role}</Badge>
                    <span>•</span>
                    <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs dashboard-text-secondary mb-3">
                    <Building2 className="h-3 w-3" />
                    <span className="line-clamp-1">{businessNames}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <div className="text-xs dashboard-text-secondary">Allocated</div>
                      <div className="font-medium">
                        {currentBusiness ? formatCurrency(totalAllocatedAmount, currentBusiness.currency) : `$${totalAllocatedAmount}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs dashboard-text-secondary">Paid</div>
                      <div className="font-medium text-green-600">
                        {currentBusiness ? formatCurrency(totalPaidAmount, currentBusiness.currency) : `$${totalPaidAmount}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs dashboard-text-secondary">Outstanding</div>
                      <div className="font-medium text-orange-600">
                        {currentBusiness ? formatCurrency(outstanding, currentBusiness.currency) : `$${outstanding}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal('view', member)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal('edit', member)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewPaymentHistory(member)}>
                      <History className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(member)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Desktop Table View
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const totalAllocatedAmount = getMemberTotalAllocated(member.id);
                const totalPaidAmount = getMemberTotalPaid(member.id);
                const outstanding = getMemberOutstanding(member.id);
                const businessNames = getMemberBusinessNames(member);
                const projectCount = getMemberProjectCount(member.id);

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={(member.memberType || 'employee') === 'employee' ? 'default' : 'secondary'}>
                        {(member.memberType || 'employee') === 'employee' ? 'Employee' : 'Contractor'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">
                      {businessNames}
                    </TableCell>
                    <TableCell>{projectCount}</TableCell>
                    <TableCell className="text-right">
                      {currentBusiness ? formatCurrency(totalAllocatedAmount, currentBusiness.currency) : `$${totalAllocatedAmount}`}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {currentBusiness ? formatCurrency(totalPaidAmount, currentBusiness.currency) : `$${totalPaidAmount}`}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {currentBusiness ? formatCurrency(outstanding, currentBusiness.currency) : `$${outstanding}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openModal('view', member)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openModal('edit', member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleViewPaymentHistory(member)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(member)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modals */}
      <TeamMemberModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        member={selectedMember}
        mode={modalMode}
      />

      {paymentHistoryMember && (
        <TeamMemberPaymentHistoryModal
          isOpen={paymentHistoryModalOpen}
          onClose={() => {
            setPaymentHistoryModalOpen(false);
            setPaymentHistoryMember(null);
          }}
          member={paymentHistoryMember}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {memberToDelete?.name}? This action cannot be undone.
              Any project allocations for this member will remain but will no longer be linked to them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

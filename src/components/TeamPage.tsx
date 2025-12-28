
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

  // Calculate comprehensive outstanding amounts (projects + salaries + quick tasks)
  const getMemberAllocations = (memberId: string) => {
    if (!currentBusiness) {
      return { totalAllocated: 0, totalPaid: 0, projectOutstanding: 0, salaryOutstanding: 0, quickTaskOutstanding: 0, totalOutstanding: 0 };
    }
    
    // 1. Project allocations outstanding
    const phaseAllocations = data.projects
      .filter(project => project.businessId === currentBusiness.id)
      .flatMap(project => 
        project.allocationTeamAllocations?.filter(alloc => alloc.memberId === memberId) || []
      );
    
    const legacyAllocations = data.projects
      .filter(project => project.businessId === currentBusiness.id)
      .flatMap(project => 
        project.teamAllocations.filter(alloc => alloc.memberId === memberId)
      );
    
    const allAllocations = [...phaseAllocations, ...legacyAllocations];
    const totalAllocated = allAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
    const totalPaid = allAllocations.reduce((sum, alloc) => sum + alloc.paidAmount, 0);
    const projectOutstanding = totalAllocated - totalPaid;
    
    // 2. Salary outstanding (current month's salary minus payments made this month)
    const memberSalaryRecords = data.salaryRecords.filter(
      r => r.teamMemberId === memberId && r.businessId === currentBusiness.id
    );
    
    // Calculate combined monthly salary (like PayrollDashboard does)
    let monthlySalaryAmount = 0;
    const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
    
    memberSalaryRecords.forEach(record => {
      const recordCurrency = allCurrencies.find(c => c.code === record.currency) || data.userSettings.defaultCurrency;
      let monthlyAmount = record.amount;
      
      // Convert to monthly equivalent based on frequency
      switch (record.frequency) {
        case 'weekly':
          monthlyAmount = record.amount * 4.33;
          break;
        case 'bi-weekly':
          monthlyAmount = record.amount * 2.17;
          break;
        case 'quarterly':
          monthlyAmount = record.amount / 3;
          break;
        case 'annually':
          monthlyAmount = record.amount / 12;
          break;
        // 'monthly' stays as is
      }
      
      // Convert to default currency
      const converted = convertCurrency(
        monthlyAmount, 
        recordCurrency, 
        data.userSettings.defaultCurrency, 
        data.exchangeRates || []
      );
      monthlySalaryAmount += converted;
    });
    
    // Check if paid this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const salaryRecordIds = memberSalaryRecords.map(r => r.id);
    
    const paidThisMonth = data.salaryPayments.some(p => {
      if (!salaryRecordIds.includes(p.salaryRecordId)) return false;
      const paymentDate = new Date(p.paymentDate);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });
    
    const salaryOutstanding = paidThisMonth ? 0 : monthlySalaryAmount;
    
    // 3. Quick tasks outstanding (completed but unpaid)
    const unpaidTasks = data.quickTasks.filter(
      t => t.assignedToId === memberId && 
           t.status === 'completed' && 
           !t.paidAt &&
           t.businessId === currentBusiness.id
    );
    const quickTaskOutstanding = unpaidTasks.reduce((sum, t) => sum + t.amount, 0);
    
    const totalOutstanding = projectOutstanding + salaryOutstanding + quickTaskOutstanding;
    
    return { 
      totalAllocated, 
      totalPaid, 
      projectOutstanding,
      salaryOutstanding,
      quickTaskOutstanding,
      totalOutstanding 
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dashboard-text-primary">Team Members</h1>
          <p className="dashboard-text-secondary">Manage your team members across all businesses</p>
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
        
        <Tabs value={memberTypeFilter} onValueChange={(v) => setMemberTypeFilter(v as 'all' | 'employee' | 'contractor')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="employee">Employees</TabsTrigger>
            <TabsTrigger value="contractor">Contractors</TabsTrigger>
          </TabsList>
        </Tabs>
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
                            {allocations.totalOutstanding > 0 && (
                              <div className="text-xs dashboard-text-secondary mt-1">
                                {allocations.projectOutstanding > 0 && <div>Projects: {formatCurrency(allocations.projectOutstanding, currentBusiness!.currency)}</div>}
                                {allocations.salaryOutstanding > 0 && <div>Salary: {formatCurrency(allocations.salaryOutstanding, currentBusiness!.currency)}</div>}
                                {allocations.quickTaskOutstanding > 0 && <div>Tasks: {formatCurrency(allocations.quickTaskOutstanding, currentBusiness!.currency)}</div>}
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

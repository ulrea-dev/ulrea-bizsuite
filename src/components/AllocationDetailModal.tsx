import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, Plus, AlertTriangle, CheckCircle, Edit } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { ProjectAllocation, AllocationTeamAllocation, AllocationPartnerAllocation, AllocationCompanyAllocation } from '@/types/business';
import { TeamAllocationEditModal } from './TeamAllocationEditModal';
import { PartnerAllocationEditModal } from './PartnerAllocationEditModal';
import { CompanyAllocationEditModal } from './CompanyAllocationEditModal';

interface AllocationDetailModalProps {
  projectId: string;
  allocation: ProjectAllocation;
  children?: React.ReactNode;
}

export const AllocationDetailModal: React.FC<AllocationDetailModalProps> = ({ 
  projectId, 
  allocation, 
  children 
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [open, setOpen] = useState(false);
  
  // Edit modal states
  const [editingTeamAllocation, setEditingTeamAllocation] = useState<AllocationTeamAllocation | null>(null);
  const [editingPartnerAllocation, setEditingPartnerAllocation] = useState<AllocationPartnerAllocation | null>(null);
  const [editingCompanyAllocation, setEditingCompanyAllocation] = useState<AllocationCompanyAllocation | null>(null);

  const project = data.projects.find(p => p.id === projectId);
  if (!project || !currentBusiness) return null;

  const allocationTeamAllocations = project.allocationTeamAllocations?.filter(a => a.allocationId === allocation.id) || [];
  const allocationPartnerAllocations = project.allocationPartnerAllocations?.filter(a => a.allocationId === allocation.id) || [];
  const allocationCompanyAllocation = project.allocationCompanyAllocations?.find(a => a.allocationId === allocation.id);

  const availableTeamMembers = data.teamMembers.filter(member => 
    !allocationTeamAllocations.some(allocation => allocation.memberId === member.id)
  );

  const availablePartners = data.partners.filter(partner => 
    !allocationPartnerAllocations.some(allocation => allocation.partnerId === partner.id)
  );

  // Budget calculation helpers
  const budgetTotals = useMemo(() => {
    const teamTotal = allocationTeamAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
    const partnerTotal = allocationPartnerAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
    const companyTotal = allocationCompanyAllocation?.totalAllocated || 0;
    const totalAllocated = teamTotal + partnerTotal + companyTotal;
    const remaining = allocation.budget - totalAllocated;
    const percentage = (totalAllocated / allocation.budget) * 100;
    
    return {
      totalBudget: allocation.budget,
      teamTotal,
      partnerTotal,
      companyTotal,
      totalAllocated,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverAllocated: totalAllocated > allocation.budget,
    };
  }, [allocation.budget, allocationTeamAllocations, allocationPartnerAllocations, allocationCompanyAllocation]);

  const validateAllocation = (allocationType: 'percentage' | 'fixed', value: string): { isValid: boolean; amount: number; message?: string } => {
    if (!value || isNaN(parseFloat(value))) {
      return { isValid: false, amount: 0, message: 'Please enter a valid amount' };
    }

    const numValue = parseFloat(value);
    const amount = allocationType === 'percentage' ? (numValue / 100) * allocation.budget : numValue;
    
    if (amount > budgetTotals.remaining) {
      return { 
        isValid: false, 
        amount, 
        message: `This would exceed the remaining budget of ${currentBusiness.currency.symbol}${budgetTotals.remaining.toLocaleString()}`
      };
    }

    return { isValid: true, amount };
  };

  const BudgetSummary = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Budget Allocation Summary
          {budgetTotals.isOverAllocated ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : budgetTotals.remaining === 0 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Budget</div>
            <div className="font-semibold text-lg">{currentBusiness.currency.symbol}{budgetTotals.totalBudget.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Remaining</div>
            <div className={`font-semibold text-lg ${budgetTotals.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {currentBusiness.currency.symbol}{budgetTotals.remaining.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Allocation Progress</span>
            <span className={budgetTotals.isOverAllocated ? 'text-destructive' : ''}>{budgetTotals.percentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={budgetTotals.percentage} 
            className={`h-3 ${budgetTotals.isOverAllocated ? 'progress-destructive' : ''}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Team</div>
            <div className="font-medium">{currentBusiness.currency.symbol}{budgetTotals.teamTotal.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Partners</div>
            <div className="font-medium">{currentBusiness.currency.symbol}{budgetTotals.partnerTotal.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Company</div>
            <div className="font-medium">{currentBusiness.currency.symbol}{budgetTotals.companyTotal.toLocaleString()}</div>
          </div>
        </div>

        {budgetTotals.isOverAllocated && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Over-allocated!</AlertTitle>
            <AlertDescription>
              The total allocation exceeds the budget by {currentBusiness.currency.symbol}{Math.abs(budgetTotals.remaining).toLocaleString()}.
              Please adjust allocations to stay within the budget limit.
            </AlertDescription>
          </Alert>
        )}
        
        {budgetTotals.percentage >= 90 && !budgetTotals.isOverAllocated && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Nearly Full</AlertTitle>
            <AlertDescription>
              You've allocated {budgetTotals.percentage.toFixed(1)}% of the budget. Only {currentBusiness.currency.symbol}{budgetTotals.remaining.toLocaleString()} remaining.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const TeamAllocationForm = () => {
    const [selectedMember, setSelectedMember] = useState('');
    const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>('percentage');
    const [allocationValue, setAllocationValue] = useState('');

    const validation = validateAllocation(allocationType, allocationValue);

    const handleAddTeamAllocation = () => {
      if (!selectedMember || !allocationValue || !validation.isValid) return;

      const member = data.teamMembers.find(m => m.id === selectedMember);
      if (!member) return;

      const value = parseFloat(allocationValue);
      const totalAllocated = validation.amount;

      const allocationData: AllocationTeamAllocation = {
        memberId: member.id,
        memberName: member.name,
        allocationId: allocation.id,
        allocationName: allocation.title,
        allocationType,
        allocationValue: value,
        totalAllocated,
        paidAmount: 0,
        outstanding: totalAllocated,
      };

      dispatch({
        type: 'ADD_ALLOCATION_TEAM_ALLOCATION',
        payload: { projectId, allocation: allocationData },
      });

      setSelectedMember('');
      setAllocationValue('');
    };

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {availableTeamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={allocationType} onValueChange={(value: any) => setAllocationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-1">
              <Input
                type="number"
                step="0.01"
                value={allocationValue}
                onChange={(e) => setAllocationValue(e.target.value)}
                placeholder={allocationType === 'percentage' ? '10' : '1000'}
                className={!validation.isValid && allocationValue ? 'border-destructive' : ''}
              />
              <Button 
                onClick={handleAddTeamAllocation} 
                size="sm"
                disabled={!selectedMember || !allocationValue || !validation.isValid}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Real-time preview */}
          {allocationValue && (
            <div className="text-sm space-y-1">
              {validation.isValid ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Allocation Amount:</span>
                  <span className="font-medium text-green-600">
                    {currentBusiness.currency.symbol}{validation.amount.toLocaleString()}
                  </span>
                </div>
              ) : validation.message && (
                <div className="text-destructive text-xs">
                  {validation.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {allocationTeamAllocations.map(alloc => (
            <Card key={alloc.memberId}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="text-sm">{alloc.memberName}</CardTitle>
                     <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                       <Badge variant="outline">
                         {alloc.allocationType === 'percentage' 
                           ? `${alloc.allocationValue}%` 
                           : `${currentBusiness.currency.symbol}${alloc.allocationValue.toLocaleString()}`
                         }
                       </Badge>
                       <span>Total: {currentBusiness.currency.symbol}{alloc.totalAllocated.toLocaleString()}</span>
                     </div>
                   </div>
                   <div className="flex gap-1">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setEditingTeamAllocation(alloc)}
                     >
                       <Edit className="w-4 h-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => dispatch({
                         type: 'REMOVE_ALLOCATION_TEAM_ALLOCATION',
                         payload: { projectId, allocationId: allocation.id, memberId: alloc.memberId },
                       })}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const PartnerAllocationForm = () => {
    const [selectedPartner, setSelectedPartner] = useState('');
    const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>('percentage');
    const [allocationValue, setAllocationValue] = useState('');

    const validation = validateAllocation(allocationType, allocationValue);

    const handleAddPartnerAllocation = () => {
      if (!selectedPartner || !allocationValue || !validation.isValid) return;

      const partner = data.partners.find(p => p.id === selectedPartner);
      if (!partner) return;

      const value = parseFloat(allocationValue);
      const totalAllocated = validation.amount;

      const allocationData: AllocationPartnerAllocation = {
        partnerId: partner.id,
        partnerName: partner.name,
        allocationId: allocation.id,
        allocationName: allocation.title,
        allocationType,
        allocationValue: value,
        totalAllocated,
        paidAmount: 0,
        outstanding: totalAllocated,
      };

      dispatch({
        type: 'ADD_ALLOCATION_PARTNER_ALLOCATION',
        payload: { projectId, allocation: allocationData },
      });

      setSelectedPartner('');
      setAllocationValue('');
    };

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger>
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                {availablePartners.map(partner => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={allocationType} onValueChange={(value: any) => setAllocationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-1">
              <Input
                type="number"
                step="0.01"
                value={allocationValue}
                onChange={(e) => setAllocationValue(e.target.value)}
                placeholder={allocationType === 'percentage' ? '10' : '1000'}
                className={!validation.isValid && allocationValue ? 'border-destructive' : ''}
              />
              <Button 
                onClick={handleAddPartnerAllocation} 
                size="sm"
                disabled={!selectedPartner || !allocationValue || !validation.isValid}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Real-time preview */}
          {allocationValue && (
            <div className="text-sm space-y-1">
              {validation.isValid ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Allocation Amount:</span>
                  <span className="font-medium text-green-600">
                    {currentBusiness.currency.symbol}{validation.amount.toLocaleString()}
                  </span>
                </div>
              ) : validation.message && (
                <div className="text-destructive text-xs">
                  {validation.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {allocationPartnerAllocations.map(alloc => (
            <Card key={alloc.partnerId}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="text-sm">{alloc.partnerName}</CardTitle>
                     <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                       <Badge variant="outline">
                         {alloc.allocationType === 'percentage' 
                           ? `${alloc.allocationValue}%` 
                           : `${currentBusiness.currency.symbol}${alloc.allocationValue.toLocaleString()}`
                         }
                       </Badge>
                       <span>Total: {currentBusiness.currency.symbol}{alloc.totalAllocated.toLocaleString()}</span>
                     </div>
                   </div>
                   <div className="flex gap-1">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setEditingPartnerAllocation(alloc)}
                     >
                       <Edit className="w-4 h-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => dispatch({
                         type: 'REMOVE_ALLOCATION_PARTNER_ALLOCATION',
                         payload: { projectId, allocationId: allocation.id, partnerId: alloc.partnerId },
                       })}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const CompanyAllocationForm = () => {
    const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>(
      allocationCompanyAllocation?.allocationType || 'percentage'
    );
    const [allocationValue, setAllocationValue] = useState(
      allocationCompanyAllocation?.allocationValue?.toString() || ''
    );

    // For existing allocations, calculate remaining budget considering we'll replace the current allocation
    const remainingForCompany = budgetTotals.remaining + (allocationCompanyAllocation?.totalAllocated || 0);
    const validation = {
      isValid: true,
      amount: 0,
      message: undefined as string | undefined
    };

    if (allocationValue) {
      const numValue = parseFloat(allocationValue);
      const amount = allocationType === 'percentage' ? (numValue / 100) * allocation.budget : numValue;
      
      if (isNaN(numValue)) {
        validation.isValid = false;
        validation.message = 'Please enter a valid amount';
      } else if (amount > remainingForCompany) {
        validation.isValid = false;
        validation.amount = amount;
        validation.message = `This would exceed the available budget of ${currentBusiness.currency.symbol}${remainingForCompany.toLocaleString()}`;
      } else {
        validation.isValid = true;
        validation.amount = amount;
      }
    }

    const handleSetCompanyAllocation = () => {
      if (!allocationValue || !validation.isValid) return;

      const value = parseFloat(allocationValue);
      const totalAllocated = validation.amount;

      const allocationData: AllocationCompanyAllocation = {
        businessId: currentBusiness.id,
        businessName: currentBusiness.name,
        allocationId: allocation.id,
        allocationName: allocation.title,
        allocationType,
        allocationValue: value,
        totalAllocated,
        paidAmount: allocationCompanyAllocation?.paidAmount || 0,
        outstanding: totalAllocated - (allocationCompanyAllocation?.paidAmount || 0),
      };

      dispatch({
        type: 'SET_ALLOCATION_COMPANY_ALLOCATION',
        payload: { projectId, allocation: allocationData },
      });
    };

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={allocationType} onValueChange={(value: any) => setAllocationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-1">
              <Input
                type="number"
                step="0.01"
                value={allocationValue}
                onChange={(e) => setAllocationValue(e.target.value)}
                placeholder={allocationType === 'percentage' ? '10' : '1000'}
                className={!validation.isValid && allocationValue ? 'border-destructive' : ''}
              />
              <Button 
                onClick={handleSetCompanyAllocation} 
                size="sm"
                disabled={!allocationValue || !validation.isValid}
              >
                Set
              </Button>
            </div>
          </div>

          {/* Real-time preview */}
          {allocationValue && (
            <div className="text-sm space-y-1">
              {validation.isValid ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Allocation Amount:</span>
                  <span className="font-medium text-green-600">
                    {currentBusiness.currency.symbol}{validation.amount.toLocaleString()}
                  </span>
                </div>
              ) : validation.message && (
                <div className="text-destructive text-xs">
                  {validation.message}
                </div>
              )}
            </div>
          )}
        </div>

        {allocationCompanyAllocation && (
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-sm">{currentBusiness.name}</CardTitle>
                   <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                     <Badge variant="outline">
                       {allocationCompanyAllocation.allocationType === 'percentage' 
                         ? `${allocationCompanyAllocation.allocationValue}%` 
                         : `${currentBusiness.currency.symbol}${allocationCompanyAllocation.allocationValue.toLocaleString()}`
                       }
                     </Badge>
                     <span>Total: {currentBusiness.currency.symbol}{allocationCompanyAllocation.totalAllocated.toLocaleString()}</span>
                   </div>
                 </div>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setEditingCompanyAllocation(allocationCompanyAllocation)}
                 >
                   <Edit className="w-4 h-4" />
                 </Button>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Allocation Details - {allocation.title}</DialogTitle>
        </DialogHeader>
        
        <BudgetSummary />
        
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="space-y-4">
            <TeamAllocationForm />
          </TabsContent>
          
          <TabsContent value="partners" className="space-y-4">
            <PartnerAllocationForm />
          </TabsContent>
          
          <TabsContent value="company" className="space-y-4">
            <CompanyAllocationForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* Edit Modals */}
      {editingTeamAllocation && (
        <TeamAllocationEditModal
          open={!!editingTeamAllocation}
          onOpenChange={(open) => !open && setEditingTeamAllocation(null)}
          projectId={projectId}
          allocation={allocation}
          teamAllocation={editingTeamAllocation}
        />
      )}
      
      {editingPartnerAllocation && (
        <PartnerAllocationEditModal
          open={!!editingPartnerAllocation}
          onOpenChange={(open) => !open && setEditingPartnerAllocation(null)}
          projectId={projectId}
          allocation={allocation}
          partnerAllocation={editingPartnerAllocation}
        />
      )}
      
      {editingCompanyAllocation && (
        <CompanyAllocationEditModal
          open={!!editingCompanyAllocation}
          onOpenChange={(open) => !open && setEditingCompanyAllocation(null)}
          projectId={projectId}
          allocation={allocation}
          companyAllocation={editingCompanyAllocation}
        />
      )}
    </Dialog>
  );
};
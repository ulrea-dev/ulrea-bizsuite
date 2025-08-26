import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { ProjectAllocation, AllocationTeamAllocation, AllocationPartnerAllocation, AllocationCompanyAllocation } from '@/types/business';

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

  const TeamAllocationForm = () => {
    const [selectedMember, setSelectedMember] = useState('');
    const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>('percentage');
    const [allocationValue, setAllocationValue] = useState('');

    const handleAddTeamAllocation = () => {
      if (!selectedMember || !allocationValue) return;

      const member = data.teamMembers.find(m => m.id === selectedMember);
      if (!member) return;

      const value = parseFloat(allocationValue);
      const totalAllocated = allocationType === 'percentage' 
        ? (value / 100) * allocation.budget 
        : value;

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
            />
            <Button onClick={handleAddTeamAllocation} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
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

    const handleAddPartnerAllocation = () => {
      if (!selectedPartner || !allocationValue) return;

      const partner = data.partners.find(p => p.id === selectedPartner);
      if (!partner) return;

      const value = parseFloat(allocationValue);
      const totalAllocated = allocationType === 'percentage' 
        ? (value / 100) * allocation.budget 
        : value;

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
            />
            <Button onClick={handleAddPartnerAllocation} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
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

    const handleSetCompanyAllocation = () => {
      if (!allocationValue) return;

      const value = parseFloat(allocationValue);
      const totalAllocated = allocationType === 'percentage' 
        ? (value / 100) * allocation.budget 
        : value;

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
            />
            <Button onClick={handleSetCompanyAllocation} size="sm">
              Set
            </Button>
          </div>
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Allocation Details - {allocation.title}</DialogTitle>
        </DialogHeader>
        
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
    </Dialog>
  );
};
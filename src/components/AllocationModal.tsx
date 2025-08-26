import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamAllocation, PartnerAllocation, CompanyAllocation } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  allocationType: 'team' | 'partner' | 'company';
  allocation?: TeamAllocation | PartnerAllocation | CompanyAllocation | null;
  mode: 'create' | 'edit' | 'view';
}

export const AllocationModal: React.FC<AllocationModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  allocationType, 
  allocation, 
  mode 
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    memberId: allocation ? ('memberId' in allocation ? allocation.memberId : allocation.partnerId) : '',
    allocationType: allocation?.allocationType || 'percentage',
    allocationValue: allocation?.allocationValue?.toString() || ''
  });

  const project = data.projects.find(p => p.id === projectId);
  
  // Get available members/partners not already allocated
  const availableMembers = allocationType === 'team' 
    ? data.teamMembers.filter(member => 
        !project?.teamAllocations?.some(allocation => allocation.memberId === member.id)
      )
    : allocationType === 'partner'
    ? data.partners.filter(partner => 
        !project?.partnerAllocations?.some(allocation => allocation.partnerId === partner.id)
      )
    : data.partners.filter(partner => 
        !project?.companyAllocations?.some(allocation => allocation.partnerId === partner.id)
      );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !currentBusiness) return;

    const member = availableMembers.find(m => m.id === formData.memberId);
    if (!member) return;

    const allocatedAmount = formData.allocationType === 'percentage'
      ? (project.totalValue * parseFloat(formData.allocationValue)) / 100
      : parseFloat(formData.allocationValue);

    if (allocationType === 'team') {
      dispatch({
        type: 'ADD_TEAM_ALLOCATION',
        payload: {
          projectId,
          allocation: {
            memberId: formData.memberId,
            memberName: member.name,
            allocationType: formData.allocationType as 'percentage' | 'fixed',
            allocationValue: parseFloat(formData.allocationValue),
            totalAllocated: allocatedAmount,
            paidAmount: 0,
            outstanding: allocatedAmount,
          },
        },
      });
    } else if (allocationType === 'partner') {
      dispatch({
        type: 'ADD_PARTNER_ALLOCATION',
        payload: {
          projectId,
          allocation: {
            partnerId: formData.memberId,
            partnerName: member.name,
            allocationType: formData.allocationType as 'percentage' | 'fixed',
            allocationValue: parseFloat(formData.allocationValue),
            totalAllocated: allocatedAmount,
            paidAmount: 0,
            outstanding: allocatedAmount,
          },
        },
      });
    } else {
      dispatch({
        type: 'ADD_COMPANY_ALLOCATION',
        payload: {
          projectId,
          allocation: {
            partnerId: formData.memberId,
            partnerName: member.name,
            allocationType: formData.allocationType as 'percentage' | 'fixed',
            allocationValue: parseFloat(formData.allocationValue),
            totalAllocated: allocatedAmount,
            paidAmount: 0,
            outstanding: allocatedAmount,
          },
        },
      });
    }

    onClose();
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add' : mode === 'edit' ? 'Edit' : 'View'} {allocationType === 'team' ? 'Team Member' : allocationType === 'partner' ? 'Partner' : 'Company'} Allocation
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' 
              ? `View ${allocationType === 'team' ? 'team member' : allocationType === 'partner' ? 'partner' : 'company'} allocation details.`
              : `${mode === 'create' ? 'Add a new' : 'Edit'} ${allocationType === 'team' ? 'team member' : allocationType === 'partner' ? 'partner' : 'company'} allocation to this project.`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member">{allocationType === 'team' ? 'Team Member' : allocationType === 'partner' ? 'Partner' : 'Company Partner'}</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, memberId: value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${allocationType === 'team' ? 'team member' : allocationType === 'partner' ? 'partner' : 'company partner'}`} />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allocationType">Allocation Type</Label>
              <Select
                value={formData.allocationType}
                onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, allocationType: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationValue">
                {formData.allocationType === 'percentage' ? 'Percentage (%)' : 'Amount'}
              </Label>
              <Input
                id="allocationValue"
                type="number"
                step={formData.allocationType === 'percentage' ? '0.1' : '0.01'}
                value={formData.allocationValue}
                onChange={(e) => setFormData(prev => ({ ...prev, allocationValue: e.target.value }))}
                placeholder={formData.allocationType === 'percentage' ? '10' : '1000.00'}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>

          {project && currentBusiness && formData.allocationValue && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Allocation Preview</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Value:</span>
                  <span>{currentBusiness.currency.symbol}{project.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allocated Amount:</span>
                  <span className="font-semibold">
                    {currentBusiness.currency.symbol}
                    {formData.allocationType === 'percentage' 
                      ? ((project.totalValue * parseFloat(formData.allocationValue)) / 100).toLocaleString()
                      : parseFloat(formData.allocationValue).toLocaleString()
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={!formData.memberId || !formData.allocationValue}>
                {mode === 'create' ? 'Add' : 'Update'} Allocation
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
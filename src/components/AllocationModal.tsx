import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamAllocation, PartnerAllocation } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  allocationType: 'team' | 'partner';
  allocation?: TeamAllocation | PartnerAllocation | null;
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
  const availableMembers = allocationType === 'team' 
    ? (data.teamMembers || []).filter(member => 
        !project?.teamAllocations?.some(alloc => alloc.memberId === member.id)
      )
    : (data.partners || []).filter(partner => 
        !project?.partnerAllocations?.some(alloc => alloc.partnerId === partner.id)
      );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !currentBusiness) return;

    const selectedMember = availableMembers.find(m => m.id === formData.memberId);
    if (!selectedMember) return;

    const allocationValue = parseFloat(formData.allocationValue);
    const totalAllocated = formData.allocationType === 'percentage' 
      ? (project.totalValue * allocationValue) / 100
      : allocationValue;

    if (allocationType === 'team') {
      const newAllocation: TeamAllocation = {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        allocationType: formData.allocationType as 'percentage' | 'fixed',
        allocationValue,
        totalAllocated,
        paidAmount: 0,
        outstanding: totalAllocated
      };

      dispatch({
        type: 'ADD_TEAM_ALLOCATION',
        payload: { projectId, allocation: newAllocation }
      });
    } else {
      const newAllocation: PartnerAllocation = {
        partnerId: selectedMember.id,
        partnerName: selectedMember.name,
        allocationType: formData.allocationType as 'percentage' | 'fixed',
        allocationValue,
        totalAllocated,
        paidAmount: 0,
        outstanding: totalAllocated
      };

      dispatch({
        type: 'ADD_PARTNER_ALLOCATION',
        payload: { projectId, allocation: newAllocation }
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
            {mode === 'create' && `Add ${allocationType === 'team' ? 'Team Member' : 'Partner'}`}
            {mode === 'edit' && 'Edit Allocation'}
            {mode === 'view' && 'Allocation Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && `Assign a ${allocationType} member to this project`}
            {mode === 'edit' && 'Update allocation information'}
            {mode === 'view' && 'View allocation information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member">{allocationType === 'team' ? 'Team Member' : 'Partner'}</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, memberId: value }))}
              disabled={isReadOnly || mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${allocationType} member`} />
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
            <div className="p-4 dashboard-surface rounded-lg">
              <h4 className="font-semibold mb-2">Allocation Preview</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="dashboard-text-secondary">Project Value:</span>
                  <span>{currentBusiness.currency.symbol}{project.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dashboard-text-secondary">Allocated Amount:</span>
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
                {mode === 'create' ? 'Add Allocation' : 'Update Allocation'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
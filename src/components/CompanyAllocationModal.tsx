import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyAllocation } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

interface CompanyAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  allocation?: CompanyAllocation | null;
  mode: 'create' | 'edit' | 'view';
}

export const CompanyAllocationModal: React.FC<CompanyAllocationModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  allocation, 
  mode 
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    allocationType: allocation?.allocationType || 'percentage',
    allocationValue: allocation?.allocationValue?.toString() || ''
  });

  const project = data.projects.find(p => p.id === projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !currentBusiness) return;

    const projectValue = project.usePhases && project.phases?.length 
      ? project.phases.reduce((sum, phase) => sum + phase.budget, 0)
      : project.totalValue;
    const allocatedAmount = formData.allocationType === 'percentage'
      ? (projectValue * parseFloat(formData.allocationValue)) / 100
      : parseFloat(formData.allocationValue);

    const newAllocation: CompanyAllocation = {
      businessId: currentBusiness.id,
      businessName: currentBusiness.name,
      allocationType: formData.allocationType as 'percentage' | 'fixed',
      allocationValue: parseFloat(formData.allocationValue),
      totalAllocated: allocatedAmount,
      paidAmount: 0,
      outstanding: allocatedAmount,
    };

    dispatch({
      type: 'SET_COMPANY_ALLOCATION',
      payload: {
        projectId,
        allocation: newAllocation,
      },
    });

    onClose();
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Set' : mode === 'edit' ? 'Edit' : 'View'} Company Allocation
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' 
              ? 'View business profit allocation for this project.'
              : `${mode === 'create' ? 'Set' : 'Edit'} the business profit allocation for this project.`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentBusiness && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Business Details</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business:</span>
                  <span>{currentBusiness.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{currentBusiness.type}</span>
                </div>
              </div>
            </div>
          )}

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
                placeholder={formData.allocationType === 'percentage' ? '25' : '5000.00'}
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
                  <span>{currentBusiness.currency.symbol}{(project.usePhases && project.phases?.length 
                    ? project.phases.reduce((sum, phase) => sum + phase.budget, 0)
                    : project.totalValue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business Profit:</span>
                  <span className="font-semibold text-green-600">
                    {currentBusiness.currency.symbol}
                    {formData.allocationType === 'percentage' 
                      ? (((project.usePhases && project.phases?.length 
                          ? project.phases.reduce((sum, phase) => sum + phase.budget, 0)
                          : project.totalValue) * parseFloat(formData.allocationValue)) / 100).toLocaleString()
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
              <Button type="submit" disabled={!formData.allocationValue}>
                {mode === 'create' ? 'Set' : 'Update'} Company Allocation
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
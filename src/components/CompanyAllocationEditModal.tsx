import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { AllocationCompanyAllocation, ProjectAllocation } from '@/types/business';

interface CompanyAllocationEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  allocation: ProjectAllocation;
  companyAllocation: AllocationCompanyAllocation;
}

export const CompanyAllocationEditModal: React.FC<CompanyAllocationEditModalProps> = ({
  open,
  onOpenChange,
  projectId,
  allocation,
  companyAllocation,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>(companyAllocation.allocationType);
  const [allocationValue, setAllocationValue] = useState(companyAllocation.allocationValue.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentBusiness) return null;

  const project = data.projects.find(p => p.id === projectId);
  if (!project) return null;

  // Calculate budget constraints
  const budgetTotals = useMemo(() => {
    const allocationTeamAllocations = project.allocationTeamAllocations?.filter(a => a.allocationId === allocation.id) || [];
    const allocationPartnerAllocations = project.allocationPartnerAllocations?.filter(a => a.allocationId === allocation.id) || [];

    const teamTotal = allocationTeamAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
    const partnerTotal = allocationPartnerAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
    // Exclude current company allocation from other allocations
    const otherAllocationsTotal = teamTotal + partnerTotal;
    const available = allocation.budget - otherAllocationsTotal;

    return { available, otherAllocationsTotal };
  }, [allocation, project]);

  // Get existing payments to prevent reducing below paid amount
  const paidAmount = useMemo(() => {
    return data.payments
      .filter(payment => 
        payment.projectId === projectId && 
        payment.recipientType === 'company' && 
        payment.allocationId === allocation.id &&
        payment.status === 'completed'
      )
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [data.payments, projectId, allocation.id]);

  const validation = useMemo(() => {
    if (!allocationValue || isNaN(parseFloat(allocationValue))) {
      return { isValid: false, amount: 0, message: 'Please enter a valid amount' };
    }

    const numValue = parseFloat(allocationValue);
    const amount = allocationType === 'percentage' ? (numValue / 100) * allocation.budget : numValue;
    
    if (amount < paidAmount) {
      return { 
        isValid: false, 
        amount, 
        message: `Cannot reduce below paid amount of ${currentBusiness.currency.symbol}${paidAmount.toLocaleString()}`
      };
    }

    if (amount > budgetTotals.available) {
      return { 
        isValid: false, 
        amount, 
        message: `This would exceed the available budget of ${currentBusiness.currency.symbol}${budgetTotals.available.toLocaleString()}`
      };
    }

    return { isValid: true, amount };
  }, [allocationType, allocationValue, allocation.budget, budgetTotals.available, paidAmount, currentBusiness.currency.symbol]);

  const handleSave = async () => {
    if (!validation.isValid) return;

    setIsSubmitting(true);
    try {
      const value = parseFloat(allocationValue);
      const totalAllocated = validation.amount;
      const outstanding = Math.max(0, totalAllocated - paidAmount);

      dispatch({
        type: 'UPDATE_ALLOCATION_COMPANY_ALLOCATION',
        payload: {
          projectId,
          allocationId: allocation.id,
          updates: {
            allocationType,
            allocationValue: value,
            totalAllocated,
            outstanding,
          },
        },
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Company Allocation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Company</Label>
            <div className="text-muted-foreground">{currentBusiness.name}</div>
          </div>

          <div>
            <Label className="text-sm font-medium">Allocation Type</Label>
            <Select value={allocationType} onValueChange={(value: any) => setAllocationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {allocationType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={allocationValue}
              onChange={(e) => setAllocationValue(e.target.value)}
              placeholder={allocationType === 'percentage' ? '10' : '1000'}
              className={!validation.isValid && allocationValue ? 'border-destructive' : ''}
            />
          </div>

          {/* Real-time preview */}
          {allocationValue && (
            <div className="text-sm space-y-2 p-3 bg-muted rounded-lg">
              {validation.isValid ? (
                <>
                  <div className="flex justify-between">
                    <span>Total Allocation:</span>
                    <span className="font-medium text-green-600">
                      {currentBusiness.currency.symbol}{validation.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Already Paid:</span>
                    <span>{currentBusiness.currency.symbol}{paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding:</span>
                    <span className="font-medium">
                      {currentBusiness.currency.symbol}{Math.max(0, validation.amount - paidAmount).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : validation.message && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validation.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!validation.isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
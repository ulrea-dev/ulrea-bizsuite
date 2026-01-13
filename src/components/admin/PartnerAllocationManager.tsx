import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Edit, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Project, ProjectAllocation, AllocationPartnerAllocation } from '@/types/business';
import { formatCurrency } from '@/utils/storage';

interface PartnerAllocationManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  allocation: ProjectAllocation;
}

export const PartnerAllocationManager: React.FC<PartnerAllocationManagerProps> = ({
  open,
  onOpenChange,
  project,
  allocation,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [editingPartner, setEditingPartner] = useState<AllocationPartnerAllocation | null>(null);
  
  // Form state for adding new partner
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>('percentage');
  const [allocationValue, setAllocationValue] = useState('');

  if (!currentBusiness) return null;

  const partners = data.partners || [];
  const allocationPartnerAllocations = project.allocationPartnerAllocations?.filter(
    a => a.allocationId === allocation.id
  ) || [];

  // Get partners not already allocated
  const availablePartners = partners.filter(
    p => !allocationPartnerAllocations.some(a => a.partnerId === p.id)
  );

  // Budget calculations
  const budgetTotals = useMemo(() => {
    const allocationTeamAllocations = project.allocationTeamAllocations?.filter(a => a.allocationId === allocation.id) || [];
    const allocationCompanyAllocation = project.allocationCompanyAllocations?.find(a => a.allocationId === allocation.id);

    const teamTotal = allocationTeamAllocations.reduce((sum, a) => sum + a.totalAllocated, 0);
    const partnerTotal = allocationPartnerAllocations.reduce((sum, a) => sum + a.totalAllocated, 0);
    const companyTotal = allocationCompanyAllocation?.totalAllocated || 0;
    const totalAllocated = teamTotal + partnerTotal + companyTotal;
    const remaining = allocation.budget - totalAllocated;

    return {
      totalBudget: allocation.budget,
      teamTotal,
      partnerTotal,
      companyTotal,
      totalAllocated,
      remaining,
      partnerPaid: allocationPartnerAllocations.reduce((sum, a) => sum + (a.paidAmount || 0), 0),
      partnerOutstanding: allocationPartnerAllocations.reduce((sum, a) => sum + (a.outstanding || 0), 0),
    };
  }, [allocation, project, allocationPartnerAllocations]);

  const calculateAmount = (type: 'percentage' | 'fixed', value: string): number => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    return type === 'percentage' ? (numValue / 100) * allocation.budget : numValue;
  };

  const handleAddPartner = () => {
    if (!selectedPartnerId || !allocationValue) return;

    const partner = partners.find(p => p.id === selectedPartnerId);
    if (!partner) return;

    const value = parseFloat(allocationValue);
    const totalAllocated = calculateAmount(allocationType, allocationValue);

    if (totalAllocated > budgetTotals.remaining) {
      return; // Don't allow over-allocation
    }

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
      payload: { projectId: project.id, allocation: allocationData },
    });

    setSelectedPartnerId('');
    setAllocationValue('');
  };

  const handleUpdatePartner = (partnerId: string, newType: 'percentage' | 'fixed', newValue: string) => {
    const existingAlloc = allocationPartnerAllocations.find(a => a.partnerId === partnerId);
    if (!existingAlloc) return;

    const value = parseFloat(newValue);
    const totalAllocated = calculateAmount(newType, newValue);
    const paidAmount = existingAlloc.paidAmount || 0;

    // Don't allow reducing below paid amount
    if (totalAllocated < paidAmount) {
      return;
    }

    dispatch({
      type: 'UPDATE_ALLOCATION_PARTNER_ALLOCATION',
      payload: {
        projectId: project.id,
        allocationId: allocation.id,
        partnerId,
        updates: {
          allocationType: newType,
          allocationValue: value,
          totalAllocated,
          outstanding: totalAllocated - paidAmount,
        },
      },
    });

    // Close the edit modal after successful update
    setEditingPartner(null);
  };

  const handleRemovePartner = (partnerId: string) => {
    const existingAlloc = allocationPartnerAllocations.find(a => a.partnerId === partnerId);
    if (!existingAlloc) return;

    // Don't allow removing if payments have been made
    if ((existingAlloc.paidAmount || 0) > 0) {
      return;
    }

    if (window.confirm('Are you sure you want to remove this partner allocation?')) {
      dispatch({
        type: 'REMOVE_ALLOCATION_PARTNER_ALLOCATION',
        payload: { projectId: project.id, allocationId: allocation.id, partnerId },
      });
    }
  };

  const previewAmount = calculateAmount(allocationType, allocationValue);
  const wouldExceedBudget = previewAmount > budgetTotals.remaining;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Partner Allocations</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {project.name} → {allocation.title}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Budget Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Phase Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Budget</div>
                  <div className="font-semibold">{formatCurrency(budgetTotals.totalBudget, currentBusiness.currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Remaining</div>
                  <div className={`font-semibold ${budgetTotals.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(budgetTotals.remaining, currentBusiness.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Partner Total</div>
                  <div className="font-semibold">{formatCurrency(budgetTotals.partnerTotal, currentBusiness.currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Partner Outstanding</div>
                  <div className="font-semibold text-orange-600">{formatCurrency(budgetTotals.partnerOutstanding, currentBusiness.currency)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Partner Form */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Partner Allocation
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
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

              <Select value={allocationType} onValueChange={(v: any) => setAllocationType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>

              {allocationType === 'fixed' ? (
                <CurrencyInput
                  value={allocationValue}
                  onChange={setAllocationValue}
                  placeholder="Amount"
                  className={wouldExceedBudget ? 'border-destructive' : ''}
                />
              ) : (
                <Input
                  type="number"
                  step="0.01"
                  value={allocationValue}
                  onChange={(e) => setAllocationValue(e.target.value)}
                  placeholder="%"
                  className={wouldExceedBudget ? 'border-destructive' : ''}
                />
              )}

              <Button
                onClick={handleAddPartner}
                disabled={!selectedPartnerId || !allocationValue || wouldExceedBudget}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {allocationValue && (
              <div className="text-sm">
                {wouldExceedBudget ? (
                  <span className="text-destructive">
                    Amount ({formatCurrency(previewAmount, currentBusiness.currency)}) exceeds remaining budget
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Allocation amount: {formatCurrency(previewAmount, currentBusiness.currency)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Current Allocations */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Current Partner Allocations ({allocationPartnerAllocations.length})
            </Label>

            {allocationPartnerAllocations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No partners allocated to this phase yet.
              </div>
            ) : (
              <div className="space-y-2">
                {allocationPartnerAllocations.map(alloc => {
                  const progressPercent = alloc.totalAllocated > 0 
                    ? ((alloc.paidAmount || 0) / alloc.totalAllocated) * 100 
                    : 0;
                  const hasPaid = (alloc.paidAmount || 0) > 0;

                  return (
                    <Card key={alloc.partnerId}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{alloc.partnerName}</span>
                              <Badge variant="outline">
                                {alloc.allocationType === 'percentage'
                                  ? `${alloc.allocationValue}%`
                                  : formatCurrency(alloc.allocationValue, currentBusiness.currency)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Total: </span>
                                <span className="font-medium">{formatCurrency(alloc.totalAllocated, currentBusiness.currency)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Paid: </span>
                                <span className="font-medium text-green-600">{formatCurrency(alloc.paidAmount || 0, currentBusiness.currency)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Outstanding: </span>
                                <span className="font-medium text-orange-600">{formatCurrency(alloc.outstanding || 0, currentBusiness.currency)}</span>
                              </div>
                            </div>

                            <div className="mt-2">
                              <Progress value={progressPercent} className="h-1.5" />
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPartner(alloc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePartner(alloc.partnerId)}
                              disabled={hasPaid}
                              title={hasPaid ? "Cannot remove - payments have been made" : "Remove allocation"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {budgetTotals.remaining < 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Total allocations exceed the phase budget by {formatCurrency(Math.abs(budgetTotals.remaining), currentBusiness.currency)}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Edit Partner Modal - Rendered outside main dialog to avoid nesting issues */}
    {editingPartner && (
      <EditPartnerModal
        open={!!editingPartner}
        onOpenChange={(open) => !open && setEditingPartner(null)}
        allocation={editingPartner}
        phaseBudget={allocation.budget}
        remainingBudget={budgetTotals.remaining}
        currency={currentBusiness.currency}
        onSave={handleUpdatePartner}
      />
    )}
    </>
  );
};

// Edit Partner Modal Component
interface EditPartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: AllocationPartnerAllocation;
  phaseBudget: number;
  remainingBudget: number;
  currency: { code: string; symbol: string };
  onSave: (partnerId: string, type: 'percentage' | 'fixed', value: string) => void;
}

const EditPartnerModal: React.FC<EditPartnerModalProps> = ({
  open,
  onOpenChange,
  allocation,
  phaseBudget,
  remainingBudget,
  currency,
  onSave,
}) => {
  const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>(allocation.allocationType);
  const [allocationValue, setAllocationValue] = useState(allocation.allocationValue.toString());

  // Reset form state when allocation changes
  useEffect(() => {
    setAllocationType(allocation.allocationType);
    setAllocationValue(allocation.allocationValue.toString());
  }, [allocation.partnerId, allocation.allocationType, allocation.allocationValue]);

  const calculateAmount = (type: 'percentage' | 'fixed', value: string): number => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    return type === 'percentage' ? (numValue / 100) * phaseBudget : numValue;
  };

  const newAmount = calculateAmount(allocationType, allocationValue);
  const paidAmount = allocation.paidAmount || 0;
  const availableBudget = remainingBudget + allocation.totalAllocated;

  const isBelowPaid = newAmount < paidAmount;
  const exceedsBudget = newAmount > availableBudget;
  const isValid = !isBelowPaid && !exceedsBudget && parseFloat(allocationValue) > 0;

  const handleSave = () => {
    if (isValid) {
      onSave(allocation.partnerId, allocationType, allocationValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Partner Allocation</DialogTitle>
          <p className="text-sm text-muted-foreground">{allocation.partnerName}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Allocation Type</Label>
              <Select value={allocationType} onValueChange={(v: any) => setAllocationType(v)}>
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
              <Label>Value</Label>
              {allocationType === 'fixed' ? (
                <CurrencyInput
                  value={allocationValue}
                  onChange={setAllocationValue}
                  placeholder="Amount"
                />
              ) : (
                <Input
                  type="number"
                  step="0.01"
                  value={allocationValue}
                  onChange={(e) => setAllocationValue(e.target.value)}
                  placeholder="%"
                />
              )}
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Total:</span>
              <span className="font-medium">{formatCurrency(newAmount, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-medium text-green-600">{formatCurrency(paidAmount, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Outstanding:</span>
              <span className="font-medium text-orange-600">{formatCurrency(Math.max(0, newAmount - paidAmount), currency)}</span>
            </div>
          </div>

          {isBelowPaid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cannot reduce below already paid amount ({formatCurrency(paidAmount, currency)})
              </AlertDescription>
            </Alert>
          )}

          {exceedsBudget && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Exceeds available budget ({formatCurrency(availableBudget, currency)})
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

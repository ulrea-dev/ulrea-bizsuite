
import React, { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { SUPPORTED_CURRENCIES } from '@/types/business';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useToast } from '@/hooks/use-toast';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryRecordId?: string | null;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({
  isOpen,
  onClose,
  salaryRecordId,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    teamMemberId: '',
    position: '',
    amount: '',
    currency: data.userSettings.defaultCurrency.code,
    frequency: 'monthly' as 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const existingRecord = salaryRecordId 
    ? (data.salaryRecords || []).find(r => r.id === salaryRecordId)
    : null;

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        teamMemberId: existingRecord.teamMemberId,
        position: existingRecord.position,
        amount: existingRecord.amount.toString(),
        currency: existingRecord.currency,
        frequency: existingRecord.frequency,
        startDate: existingRecord.startDate.split('T')[0],
        description: existingRecord.description || '',
      });
    } else {
      setFormData({
        teamMemberId: '',
        position: '',
        amount: '',
        currency: data.userSettings.defaultCurrency.code,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [existingRecord, data.userSettings.defaultCurrency.code]);

  useEffect(() => {
    // Calculate converted amount when amount or currency changes
    if (formData.amount && formData.currency !== data.userSettings.defaultCurrency.code) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount)) {
        const fromCurrency = SUPPORTED_CURRENCIES.find(c => c.code === formData.currency);
        if (fromCurrency) {
          const converted = convertCurrency(
            amount,
            fromCurrency,
            data.userSettings.defaultCurrency,
            data.exchangeRates || []
          );
          setConvertedAmount(converted);
        }
      }
    } else {
      setConvertedAmount(null);
    }
  }, [formData.amount, formData.currency, data.userSettings.defaultCurrency, data.exchangeRates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentBusiness) {
      toast({
        title: "Error",
        description: "Please select a business first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.teamMemberId || !formData.position || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    const salaryRecord = {
      id: existingRecord?.id || generateId(),
      businessId: currentBusiness.id,
      teamMemberId: formData.teamMemberId,
      position: formData.position,
      amount,
      currency: formData.currency,
      frequency: formData.frequency,
      startDate: new Date(formData.startDate).toISOString(),
      description: formData.description,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingRecord) {
      dispatch({
        type: 'UPDATE_SALARY_RECORD',
        payload: { id: existingRecord.id, updates: salaryRecord },
      });
      toast({
        title: "Success",
        description: "Salary record updated successfully.",
      });
    } else {
      dispatch({
        type: 'ADD_SALARY_RECORD',
        payload: salaryRecord,
      });
      toast({
        title: "Success",
        description: "Salary record added successfully.",
      });
    }

    onClose();
  };

  const currentBusinessTeamMembers = data.teamMembers.filter(
    member => !currentBusiness || member.id // Show all if no business selected, or filter by business if needed
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingRecord ? 'Edit Salary Record' : 'Add Salary Record'}
          </DialogTitle>
          <DialogDescription>
            {existingRecord 
              ? 'Update the salary information for this team member.'
              : 'Add a new salary record for a team member.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="teamMember">Team Member *</Label>
            <Select
              value={formData.teamMemberId}
              onValueChange={(value) => setFormData({ ...formData, teamMemberId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {currentBusinessTeamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Software Developer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
                required
              />
              {convertedAmount !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {data.userSettings.defaultCurrency.symbol}{convertedAmount.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes (optional)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {existingRecord ? 'Update' : 'Add'} Salary Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

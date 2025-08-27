
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId, formatCurrency } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_CURRENCIES, SalaryPayment } from '@/types/business';

interface SalaryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryRecordId: string | null;
}

export const SalaryPaymentModal: React.FC<SalaryPaymentModalProps> = ({
  isOpen,
  onClose,
  salaryRecordId,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  // Get all available currencies
  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  
  // Find the salary record and team member
  const salaryRecord = data.salaryRecords.find(record => record.id === salaryRecordId);
  const teamMember = salaryRecord ? data.teamMembers.find(member => member.id === salaryRecord.teamMemberId) : null;

  // Get all salary records for this team member to calculate combined total
  const memberSalaryRecords = salaryRecord ? 
    data.salaryRecords.filter(record => record.teamMemberId === salaryRecord.teamMemberId && record.businessId === currentBusiness?.id) : [];
  
  const primaryRecord = memberSalaryRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
  const secondaryRecord = memberSalaryRecords.find(r => (r as any).salaryType === 'secondary');

  // Calculate combined monthly equivalent salary
  const calculateCombinedSalary = () => {
    let total = 0;

    if (primaryRecord) {
      const primaryCurrency = allCurrencies.find(c => c.code === primaryRecord.currency) || data.userSettings.defaultCurrency;
      let monthlyAmount = primaryRecord.amount;
      
      // Convert to monthly equivalent
      switch (primaryRecord.frequency) {
        case 'weekly':
          monthlyAmount = primaryRecord.amount * 4.33;
          break;
        case 'bi-weekly':
          monthlyAmount = primaryRecord.amount * 2.17;
          break;
        case 'quarterly':
          monthlyAmount = primaryRecord.amount / 3;
          break;
        case 'annually':
          monthlyAmount = primaryRecord.amount / 12;
          break;
      }

      const converted = convertCurrency(monthlyAmount, primaryCurrency, data.userSettings.defaultCurrency, data.exchangeRates || []);
      total += converted;
    }

    if (secondaryRecord) {
      const secondaryCurrency = allCurrencies.find(c => c.code === secondaryRecord.currency) || data.userSettings.defaultCurrency;
      let monthlyAmount = secondaryRecord.amount;
      
      // Convert to monthly equivalent
      switch (secondaryRecord.frequency) {
        case 'weekly':
          monthlyAmount = secondaryRecord.amount * 4.33;
          break;
        case 'bi-weekly':
          monthlyAmount = secondaryRecord.amount * 2.17;
          break;
        case 'quarterly':
          monthlyAmount = secondaryRecord.amount / 3;
          break;
        case 'annually':
          monthlyAmount = secondaryRecord.amount / 12;
          break;
      }

      const converted = convertCurrency(monthlyAmount, secondaryCurrency, data.userSettings.defaultCurrency, data.exchangeRates || []);
      total += converted;
    }

    return total;
  };

  const combinedSalary = calculateCombinedSalary();

  useEffect(() => {
    if (isOpen && salaryRecord) {
      // Set default amount to combined salary
      setAmount(combinedSalary.toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('');
      setNotes('');
    }
  }, [isOpen, salaryRecord, combinedSalary]);

  const handleSave = () => {
    if (!salaryRecord || !currentBusiness) {
      toast({
        title: "Error",
        description: "Salary record not found",
        variant: "destructive",
      });
      return;
    }

    if (!amount || !paymentDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const payment: SalaryPayment = {
      id: generateId(),
      salaryRecordId: salaryRecord.id,
      amount: parseFloat(amount),
      paymentDate,
      period: `${new Date(paymentDate).toLocaleDateString()} Payment`,
      method: paymentMethod || undefined,
      description: notes || undefined,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_SALARY_PAYMENT', payload: payment });

    toast({
      title: "Success",
      description: "Salary payment recorded successfully",
    });

    onClose();
  };

  if (!salaryRecord || !teamMember) {
    return null;
  }

  // Get salary breakdown for display
  const getSalaryBreakdown = () => {
    const breakdown = [];
    
    if (primaryRecord) {
      const primaryCurrency = allCurrencies.find(c => c.code === primaryRecord.currency) || data.userSettings.defaultCurrency;
      breakdown.push({
        type: 'Primary',
        position: primaryRecord.position,
        amount: formatCurrency(primaryRecord.amount, primaryCurrency),
        frequency: primaryRecord.frequency,
      });
    }
    
    if (secondaryRecord) {
      const secondaryCurrency = allCurrencies.find(c => c.code === secondaryRecord.currency) || data.userSettings.defaultCurrency;
      breakdown.push({
        type: 'Secondary',
        position: secondaryRecord.position,
        amount: formatCurrency(secondaryRecord.amount, secondaryCurrency),  
        frequency: secondaryRecord.frequency,
      });
    }
    
    return breakdown;
  };

  const salaryBreakdown = getSalaryBreakdown();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Salary Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Record a salary payment for {teamMember.name}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div><strong>Employee:</strong> {teamMember.name}</div>
            
            {/* Show salary breakdown */}
            {salaryBreakdown.map((salary, index) => (
              <div key={index} className="text-sm">
                <strong>{salary.type} - {salary.position}:</strong> {salary.amount} ({salary.frequency})
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <strong>Combined Monthly Total:</strong> {formatCurrency(combinedSalary, data.userSettings.defaultCurrency)}
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              In {data.userSettings.defaultCurrency.name} ({data.userSettings.defaultCurrency.symbol})
            </p>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="e.g., Bank transfer, Cash, Check"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this payment (optional)"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

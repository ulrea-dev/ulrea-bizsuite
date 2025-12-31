
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId, formatCurrency } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_CURRENCIES, SalaryPayment } from '@/types/business';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
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
  const secondaryRecords = memberSalaryRecords.filter(r => (r as any).salaryType === 'secondary');

  // Helper function to convert to monthly equivalent
  const getMonthlyEquivalent = (amount: number, frequency: string): number => {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'bi-weekly': return amount * 2.17;
      case 'quarterly': return amount / 3;
      case 'annually': return amount / 12;
      default: return amount;
    }
  };

  // Calculate combined monthly equivalent salary
  const calculateCombinedSalary = () => {
    let total = 0;

    if (primaryRecord) {
      const primaryCurrency = allCurrencies.find(c => c.code === primaryRecord.currency) || data.userSettings.defaultCurrency;
      const monthlyAmount = getMonthlyEquivalent(primaryRecord.amount, primaryRecord.frequency);
      const converted = convertCurrency(monthlyAmount, primaryCurrency, data.userSettings.defaultCurrency, data.exchangeRates || []);
      total += converted;
    }

    // Process ALL secondary records
    secondaryRecords.forEach(secondaryRecord => {
      const secondaryCurrency = allCurrencies.find(c => c.code === secondaryRecord.currency) || data.userSettings.defaultCurrency;
      const monthlyAmount = getMonthlyEquivalent(secondaryRecord.amount, secondaryRecord.frequency);
      const converted = convertCurrency(monthlyAmount, secondaryCurrency, data.userSettings.defaultCurrency, data.exchangeRates || []);
      total += converted;
    });

    return total;
  };

  const combinedSalary = calculateCombinedSalary();

  useEffect(() => {
    if (isOpen && salaryRecord) {
      // Set default amount to combined salary
      setAmount(combinedSalary.toString());
      setPaymentDate(new Date());
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

    // Collect all salary record IDs for this team member
    const allSalaryRecordIds: string[] = [];
    if (primaryRecord) allSalaryRecordIds.push(primaryRecord.id);
    secondaryRecords.forEach(sr => allSalaryRecordIds.push(sr.id));

    // Calculate proportional amounts for each salary record
    const totalAmount = parseFloat(amount);
    const combinedTotal = calculateCombinedSalary();

    // Create a payment for each salary record proportionally
    allSalaryRecordIds.forEach(recordId => {
      const record = memberSalaryRecords.find(r => r.id === recordId);
      if (!record) return;

      const recordCurrency = allCurrencies.find(c => c.code === record.currency) || data.userSettings.defaultCurrency;
      const monthlyAmount = getMonthlyEquivalent(record.amount, record.frequency);
      const convertedAmount = convertCurrency(monthlyAmount, recordCurrency, data.userSettings.defaultCurrency, data.exchangeRates || []);
      
      // Calculate proportional payment amount
      const proportion = combinedTotal > 0 ? convertedAmount / combinedTotal : 1 / allSalaryRecordIds.length;
      const paymentAmount = totalAmount * proportion;

      const payment: SalaryPayment = {
        id: generateId(),
        salaryRecordId: recordId,
        amount: paymentAmount,
        paymentDate: paymentDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        period: `${paymentDate?.toLocaleDateString()} Payment`,
        method: paymentMethod || undefined,
        description: notes || undefined,
        status: 'paid',
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_SALARY_PAYMENT', payload: payment });
    });

    toast({
      title: "Success",
      description: `Recorded ${allSalaryRecordIds.length} payment(s) successfully`,
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
    
    // Include ALL secondary records
    secondaryRecords.forEach((secondaryRecord, index) => {
      const secondaryCurrency = allCurrencies.find(c => c.code === secondaryRecord.currency) || data.userSettings.defaultCurrency;
      breakdown.push({
        type: `Secondary ${secondaryRecords.length > 1 ? `#${index + 1}` : ''}`,
        position: secondaryRecord.position,
        amount: formatCurrency(secondaryRecord.amount, secondaryCurrency),  
        frequency: secondaryRecord.frequency,
      });
    });
    
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
            <CurrencyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
              allowDecimals={true}
              maxDecimals={2}
            />
            <p className="text-xs text-muted-foreground">
              In {data.userSettings.defaultCurrency.name} ({data.userSettings.defaultCurrency.symbol})
            </p>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "MMM dd, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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

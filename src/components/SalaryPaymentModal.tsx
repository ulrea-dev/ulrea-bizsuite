
import React, { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId, formatCurrency } from '@/utils/storage';
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
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useToast } from '@/hooks/use-toast';

interface SalaryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryRecordId?: string | null;
}

export const SalaryPaymentModal: React.FC<SalaryPaymentModalProps> = ({
  isOpen,
  onClose,
  salaryRecordId,
}) => {
  const { data, dispatch } = useBusiness();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    description: '',
  });

  const salaryRecord = salaryRecordId 
    ? (data.salaryRecords || []).find(r => r.id === salaryRecordId)
    : null;

  const teamMember = salaryRecord 
    ? data.teamMembers.find(m => m.id === salaryRecord.teamMemberId)
    : null;

  const currency = salaryRecord 
    ? SUPPORTED_CURRENCIES.find(c => c.code === salaryRecord.currency) || data.userSettings.defaultCurrency
    : data.userSettings.defaultCurrency;

  useEffect(() => {
    if (salaryRecord) {
      setFormData({
        amount: salaryRecord.amount.toString(),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        description: '',
      });
    }
  }, [salaryRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!salaryRecord) {
      toast({
        title: "Error",
        description: "Salary record not found.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.paymentDate) {
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

    const salaryPayment = {
      id: generateId(),
      salaryRecordId: salaryRecord.id,
      amount,
      paymentDate: new Date(formData.paymentDate).toISOString(),
      paymentMethod: formData.paymentMethod,
      description: formData.description,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: 'ADD_SALARY_PAYMENT',
      payload: salaryPayment,
    });

    toast({
      title: "Success",
      description: "Salary payment recorded successfully.",
    });

    onClose();
  };

  if (!salaryRecord || !teamMember) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Salary Payment</DialogTitle>
          <DialogDescription>
            Record a salary payment for {teamMember.name} ({salaryRecord.position})
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-3 rounded-lg mb-4">
          <div className="text-sm">
            <p><strong>Employee:</strong> {teamMember.name}</p>
            <p><strong>Position:</strong> {salaryRecord.position}</p>
            <p><strong>Regular Amount:</strong> {formatCurrency(salaryRecord.amount, currency)}</p>
            <p><strong>Frequency:</strong> {salaryRecord.frequency}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Payment Amount *</Label>
            <CurrencyInput
              id="amount"
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              In {currency.name} ({currency.symbol})
            </p>
          </div>

          <div>
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input
              id="paymentMethod"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              placeholder="e.g., Bank transfer, Cash, Check"
            />
          </div>

          <div>
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes about this payment (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

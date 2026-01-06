import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Checkbox } from '@/components/ui/checkbox';
import { useBusiness } from '@/contexts/BusinessContext';
import { RenewalPayment, Renewal, SUPPORTED_CURRENCIES } from '@/types/business';
import { addMonths, addYears, format } from 'date-fns';

interface RenewalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  renewal: Renewal;
  existingPayment?: RenewalPayment;
}

export const RenewalPaymentModal: React.FC<RenewalPaymentModalProps> = ({
  isOpen,
  onClose,
  renewal,
  existingPayment,
}) => {
  const { data, dispatch } = useBusiness();
  const isEditing = !!existingPayment;

  const [amount, setAmount] = useState(existingPayment?.amount.toString() || renewal.amount.toString());
  const [currency, setCurrency] = useState(existingPayment?.currency || renewal.currency);
  const [date, setDate] = useState(existingPayment?.date || format(new Date(), 'yyyy-MM-dd'));
  const [invoiceUrl, setInvoiceUrl] = useState(existingPayment?.invoiceUrl || '');
  const [invoiceFileName, setInvoiceFileName] = useState(existingPayment?.invoiceFileName || '');
  const [notes, setNotes] = useState(existingPayment?.notes || '');
  const [status, setStatus] = useState<'pending' | 'completed'>(existingPayment?.status || 'completed');
  const [markAsRenewed, setMarkAsRenewed] = useState(true);

  const allCurrencies = useMemo(() => {
    return [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  }, [data.customCurrencies]);

  const calculateNextRenewalDate = (currentDate: string, frequency: 'monthly' | 'quarterly' | 'yearly'): string => {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'monthly':
        return format(addMonths(date, 1), 'yyyy-MM-dd');
      case 'quarterly':
        return format(addMonths(date, 3), 'yyyy-MM-dd');
      case 'yearly':
        return format(addYears(date, 1), 'yyyy-MM-dd');
      default:
        return format(addYears(date, 1), 'yyyy-MM-dd');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    const paymentAmount = parseFloat(amount);

    if (isEditing && existingPayment) {
      dispatch({
        type: 'UPDATE_RENEWAL_PAYMENT',
        payload: {
          id: existingPayment.id,
          updates: {
            amount: paymentAmount,
            currency,
            date,
            invoiceUrl: invoiceUrl || undefined,
            invoiceFileName: invoiceFileName || undefined,
            notes: notes || undefined,
            status,
          },
        },
      });
    } else {
      const paymentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      dispatch({
        type: 'ADD_RENEWAL_PAYMENT',
        payload: {
          id: paymentId,
          renewalId: renewal.id,
          amount: paymentAmount,
          currency,
          date,
          invoiceUrl: invoiceUrl || undefined,
          invoiceFileName: invoiceFileName || undefined,
          notes: notes || undefined,
          status,
          createdAt: new Date().toISOString(),
        },
      });

      // Update the renewal's lastPaidDate and totalPaid
      const currentTotalPaid = renewal.totalPaid || 0;
      const newTotalPaid = currentTotalPaid + paymentAmount;

      const renewalUpdates: Partial<Renewal> = {
        lastPaidDate: date,
        totalPaid: newTotalPaid,
      };

      // If marked as renewed, also update the next renewal date
      if (markAsRenewed && status === 'completed') {
        renewalUpdates.nextRenewalDate = calculateNextRenewalDate(renewal.nextRenewalDate, renewal.frequency);
      }

      dispatch({
        type: 'UPDATE_RENEWAL',
        payload: {
          id: renewal.id,
          updates: renewalUpdates,
        },
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Renewal</p>
            <p className="font-medium">{renewal.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{renewal.frequency}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <CurrencyInput
                id="amount"
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'pending' | 'completed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceUrl">Invoice Link (Optional)</Label>
            <Input
              id="invoiceUrl"
              type="url"
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceFileName">Invoice File Name (Optional)</Label>
            <Input
              id="invoiceFileName"
              value={invoiceFileName}
              onChange={(e) => setInvoiceFileName(e.target.value)}
              placeholder="invoice-2024-01.pdf"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              rows={2}
            />
          </div>

          {!isEditing && (
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="markAsRenewed"
                checked={markAsRenewed}
                onCheckedChange={(checked) => setMarkAsRenewed(checked === true)}
              />
              <Label htmlFor="markAsRenewed" className="text-sm cursor-pointer">
                Mark as renewed (auto-calculate next renewal date)
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!amount || !date}>
              {isEditing ? 'Update Payment' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

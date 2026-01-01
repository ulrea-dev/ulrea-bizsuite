import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Payable, PayableStatus, SUPPORTED_CURRENCIES, EXPENSE_CATEGORIES } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { CurrencyInput } from '@/components/ui/currency-input';
import { format } from 'date-fns';

interface PayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  payable?: Payable | null;
}

export const PayableModal: React.FC<PayableModalProps> = ({
  isOpen,
  onClose,
  payable,
}) => {
  const { currentBusiness, dispatch, data } = useBusiness();
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [currency, setCurrency] = useState(currentBusiness?.currency.code || 'USD');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<PayableStatus>('pending');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [accountId, setAccountId] = useState('');

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  const businessAccounts = data.bankAccounts.filter(
    (a) => a.businessId === currentBusiness?.id
  );

  useEffect(() => {
    if (payable) {
      setVendorName(payable.vendorName);
      setAmount(payable.amount.toString());
      setPaidAmount(payable.paidAmount.toString());
      setCurrency(payable.currency);
      setDueDate(payable.dueDate);
      setStatus(payable.status);
      setCategory(payable.category || '');
      setDescription(payable.description || '');
      setInvoiceRef(payable.invoiceRef || '');
      setAccountId(payable.accountId || '');
    } else {
      setVendorName('');
      setAmount('0');
      setPaidAmount('0');
      setCurrency(currentBusiness?.currency.code || 'USD');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setStatus('pending');
      setCategory('');
      setDescription('');
      setInvoiceRef('');
      setAccountId('');
    }
  }, [payable, currentBusiness, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !vendorName.trim()) return;

    const now = new Date().toISOString();
    const amountNum = parseFloat(amount) || 0;
    const paidAmountNum = parseFloat(paidAmount) || 0;

    // Auto-determine status based on amounts
    let finalStatus: PayableStatus = status;
    if (paidAmountNum >= amountNum) {
      finalStatus = 'paid';
    } else if (paidAmountNum > 0) {
      finalStatus = 'partial';
    } else if (new Date(dueDate) < new Date() && finalStatus !== 'paid') {
      finalStatus = 'overdue';
    }

    if (payable) {
      dispatch({
        type: 'UPDATE_PAYABLE',
        payload: {
          id: payable.id,
          updates: {
            vendorName: vendorName.trim(),
            amount: amountNum,
            paidAmount: paidAmountNum,
            currency,
            dueDate,
            status: finalStatus,
            category: category || undefined,
            description: description.trim() || undefined,
            invoiceRef: invoiceRef.trim() || undefined,
            accountId: accountId || undefined,
          },
        },
      });
    } else {
      const newPayable: Payable = {
        id: crypto.randomUUID(),
        businessId: currentBusiness.id,
        vendorName: vendorName.trim(),
        amount: amountNum,
        paidAmount: paidAmountNum,
        currency,
        dueDate,
        status: finalStatus,
        category: category || undefined,
        description: description.trim() || undefined,
        invoiceRef: invoiceRef.trim() || undefined,
        accountId: accountId || undefined,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_PAYABLE', payload: newPayable });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{payable ? 'Edit Payable' : 'Add Payable'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name *</Label>
            <Input
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., AWS, Adobe, Contractor Name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Owed *</Label>
              <CurrencyInput
                id="amount"
                value={amount}
                onChange={setAmount}
                allowDecimals
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Amount Paid</Label>
              <CurrencyInput
                id="paidAmount"
                value={paidAmount}
                onChange={setPaidAmount}
                allowDecimals
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {businessAccounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="accountId">Pay From Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {businessAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="invoiceRef">Invoice Reference</Label>
            <Input
              id="invoiceRef"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="e.g., INV-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{payable ? 'Update' : 'Add'} Payable</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

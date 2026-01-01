import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Receivable, ReceivableStatus, SUPPORTED_CURRENCIES } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { CurrencyInput } from '@/components/ui/currency-input';
import { format } from 'date-fns';

interface ReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable?: Receivable | null;
}

export const ReceivableModal: React.FC<ReceivableModalProps> = ({
  isOpen,
  onClose,
  receivable,
}) => {
  const { currentBusiness, dispatch, data } = useBusiness();
  const [sourceName, setSourceName] = useState('');
  const [amount, setAmount] = useState('0');
  const [receivedAmount, setReceivedAmount] = useState('0');
  const [currency, setCurrency] = useState(currentBusiness?.currency.code || 'USD');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [accountId, setAccountId] = useState('');

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  const businessAccounts = data.bankAccounts.filter(
    (a) => a.businessId === currentBusiness?.id
  );
  const businessClients = data.clients.filter((c) =>
    data.projects.some((p) => p.businessId === currentBusiness?.id && p.clientId === c.id)
  );
  const businessProjects = data.projects.filter(
    (p) => p.businessId === currentBusiness?.id
  );

  useEffect(() => {
    if (receivable) {
      setSourceName(receivable.sourceName);
      setAmount(receivable.amount.toString());
      setReceivedAmount(receivable.receivedAmount.toString());
      setCurrency(receivable.currency);
      setDueDate(receivable.dueDate);
      setClientId(receivable.clientId || '');
      setProjectId(receivable.projectId || '');
      setDescription(receivable.description || '');
      setInvoiceRef(receivable.invoiceRef || '');
      setAccountId(receivable.accountId || '');
    } else {
      setSourceName('');
      setAmount('0');
      setReceivedAmount('0');
      setCurrency(currentBusiness?.currency.code || 'USD');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setClientId('');
      setProjectId('');
      setDescription('');
      setInvoiceRef('');
      setAccountId('');
    }
  }, [receivable, currentBusiness, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !sourceName.trim()) return;

    const now = new Date().toISOString();
    const amountNum = parseFloat(amount) || 0;
    const receivedAmountNum = parseFloat(receivedAmount) || 0;

    // Auto-determine status based on amounts
    let finalStatus: ReceivableStatus = 'pending';
    if (receivedAmountNum >= amountNum) {
      finalStatus = 'paid';
    } else if (receivedAmountNum > 0) {
      finalStatus = 'partial';
    } else if (new Date(dueDate) < new Date()) {
      finalStatus = 'overdue';
    }

    if (receivable) {
      dispatch({
        type: 'UPDATE_RECEIVABLE',
        payload: {
          id: receivable.id,
          updates: {
            sourceName: sourceName.trim(),
            amount: amountNum,
            receivedAmount: receivedAmountNum,
            currency,
            dueDate,
            status: finalStatus,
            clientId: clientId || undefined,
            projectId: projectId || undefined,
            description: description.trim() || undefined,
            invoiceRef: invoiceRef.trim() || undefined,
            accountId: accountId || undefined,
          },
        },
      });
    } else {
      const newReceivable: Receivable = {
        id: crypto.randomUUID(),
        businessId: currentBusiness.id,
        sourceName: sourceName.trim(),
        amount: amountNum,
        receivedAmount: receivedAmountNum,
        currency,
        dueDate,
        status: finalStatus,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        description: description.trim() || undefined,
        invoiceRef: invoiceRef.trim() || undefined,
        accountId: accountId || undefined,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_RECEIVABLE', payload: newReceivable });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{receivable ? 'Edit Receivable' : 'Add Receivable'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceName">Source / Description *</Label>
            <Input
              id="sourceName"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g., Invoice #123, Project Payment"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Expected *</Label>
              <CurrencyInput
                id="amount"
                value={amount}
                onChange={setAmount}
                allowDecimals
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedAmount">Amount Received</Label>
              <CurrencyInput
                id="receivedAmount"
                value={receivedAmount}
                onChange={setReceivedAmount}
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

          {businessClients.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="clientId">Related Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {businessClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {businessProjects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="projectId">Related Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {businessProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {businessAccounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="accountId">Receive Into Account</Label>
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
            <Button type="submit">{receivable ? 'Update' : 'Add'} Receivable</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

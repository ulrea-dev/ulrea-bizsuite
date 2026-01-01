import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { BankAccount, BankAccountType, SUPPORTED_CURRENCIES } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { CurrencyInput } from '@/components/ui/currency-input';

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: BankAccount | null;
}

const ACCOUNT_TYPES: { value: BankAccountType; label: string }[] = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Cash' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
];

export const BankAccountModal: React.FC<BankAccountModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { currentBusiness, dispatch, data } = useBusiness();
  const [name, setName] = useState('');
  const [type, setType] = useState<BankAccountType>('bank');
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState(currentBusiness?.currency.code || 'USD');
  const [accountNumber, setAccountNumber] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(account.balance.toString());
      setCurrency(account.currency);
      setAccountNumber(account.accountNumber || '');
      setDescription(account.description || '');
      setIsDefault(account.isDefault);
    } else {
      setName('');
      setType('bank');
      setBalance('0');
      setCurrency(currentBusiness?.currency.code || 'USD');
      setAccountNumber('');
      setDescription('');
      setIsDefault(false);
    }
  }, [account, currentBusiness, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !name.trim()) return;

    const now = new Date().toISOString();
    const balanceNum = parseFloat(balance) || 0;

    if (account) {
      dispatch({
        type: 'UPDATE_BANK_ACCOUNT',
        payload: {
          id: account.id,
          updates: {
            name: name.trim(),
            type,
            balance: balanceNum,
            currency,
            accountNumber: accountNumber.trim() || undefined,
            description: description.trim() || undefined,
            isDefault,
          },
        },
      });
    } else {
      const newAccount: BankAccount = {
        id: crypto.randomUUID(),
        businessId: currentBusiness.id,
        name: name.trim(),
        type,
        balance: balanceNum,
        currency,
        accountNumber: accountNumber.trim() || undefined,
        description: description.trim() || undefined,
        isDefault,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_BANK_ACCOUNT', payload: newAccount });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Business Checking"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as BankAccountType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <CurrencyInput
                id="balance"
                value={balance}
                onChange={setBalance}
                allowDecimals
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

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number (Optional)</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Last 4 digits or reference"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isDefault">Set as Default Account</Label>
            <Switch
              id="isDefault"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{account ? 'Update' : 'Add'} Account</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useBusiness } from '@/contexts/BusinessContext';
import { RenewalType, SUPPORTED_CURRENCIES } from '@/types/business';

interface AddRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RENEWAL_TYPES: { value: RenewalType; label: string }[] = [
  { value: 'domain', label: 'Domain' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'software', label: 'Software' },
  { value: 'ssl', label: 'SSL Certificate' },
  { value: 'email', label: 'Email Service' },
  { value: 'other', label: 'Other' },
];

export const AddRenewalModal: React.FC<AddRenewalModalProps> = ({ isOpen, onClose }) => {
  const { data, currentBusiness, dispatch } = useBusiness();

  const [name, setName] = useState('');
  const [type, setType] = useState<RenewalType>('domain');
  const [retainerId, setRetainerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(currentBusiness?.currency.code || 'USD');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [nextRenewalDate, setNextRenewalDate] = useState('');
  const [description, setDescription] = useState('');

  const businessRetainers = useMemo(() => {
    if (!currentBusiness) return [];
    return data.retainers?.filter((r) => r.businessId === currentBusiness.id) || [];
  }, [data.retainers, currentBusiness]);

  const selectedRetainer = useMemo(() => {
    return businessRetainers.find((r) => r.id === retainerId);
  }, [businessRetainers, retainerId]);

  const selectedClient = useMemo(() => {
    if (!selectedRetainer) return null;
    return data.clients.find((c) => c.id === selectedRetainer.clientId);
  }, [selectedRetainer, data.clients]);

  const allCurrencies = useMemo(() => {
    return [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  }, [data.customCurrencies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retainerId || !name || !amount || !nextRenewalDate) return;

    const renewalId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    dispatch({
      type: 'ADD_RENEWAL_TO_RETAINER',
      payload: {
        retainerId,
        renewal: {
          id: renewalId,
          name,
          type,
          amount: parseFloat(amount),
          currency,
          frequency,
          nextRenewalDate,
          description: description || undefined,
        },
      },
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Renewal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retainer">Retainer *</Label>
            <Select value={retainerId} onValueChange={setRetainerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a retainer" />
              </SelectTrigger>
              <SelectContent>
                {businessRetainers.map((retainer) => (
                  <SelectItem key={retainer.id} value={retainer.id}>
                    {retainer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{selectedClient.name}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Renewal Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., example.com Domain"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as RenewalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RENEWAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={(value) => setFrequency(value as 'monthly' | 'quarterly' | 'yearly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextRenewalDate">Next Renewal Date *</Label>
              <Input
                id="nextRenewalDate"
                type="date"
                value={nextRenewalDate}
                onChange={(e) => setNextRenewalDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes about this renewal..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!retainerId || !name || !amount || !nextRenewalDate}>
              Add Renewal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

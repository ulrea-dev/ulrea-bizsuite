import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';
import { SUPPORTED_CURRENCIES } from '@/types/business';

interface AddRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRetainerId?: string;
}

export const AddRenewalModal: React.FC<AddRenewalModalProps> = ({ isOpen, onClose, preselectedRetainerId }) => {
  const { data, currentBusiness, dispatch } = useBusiness();

  // Find preselected retainer to get clientId
  const preselectedRetainer = preselectedRetainerId 
    ? data.retainers.find(r => r.id === preselectedRetainerId) 
    : undefined;

  const [name, setName] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [clientId, setClientId] = useState(preselectedRetainer?.clientId || '');
  const [retainerId, setRetainerId] = useState(preselectedRetainerId || 'none');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(currentBusiness?.currency.code || 'USD');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [nextRenewalDate, setNextRenewalDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');

  const allCurrencies = useMemo(() => {
    return [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  }, [data.customCurrencies]);

  // Get retainers for the selected client
  const clientRetainers = useMemo(() => {
    if (!clientId) return [];
    return data.retainers.filter(r => r.clientId === clientId && r.businessId === currentBusiness?.id);
  }, [clientId, data.retainers, currentBusiness?.id]);

  // Reset retainer when client changes (unless preselected)
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    if (!preselectedRetainerId) {
      setRetainerId('none');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !name || !amount || !nextRenewalDate || !currentBusiness) return;

    const renewalId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    dispatch({
      type: 'ADD_RENEWAL',
      payload: {
        id: renewalId,
        businessId: currentBusiness.id,
        clientId,
        retainerId: retainerId !== 'none' ? retainerId : undefined,
        name,
        serviceTypeId: serviceTypeId || undefined,
        amount: parseFloat(amount),
        currency,
        frequency,
        nextRenewalDate: nextRenewalDate!.toISOString().split('T')[0],
        description: description || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={handleClientChange} disabled={!!preselectedRetainerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {data.clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clientId && clientRetainers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="retainer">Link to Retainer (Optional)</Label>
              <Select value={retainerId} onValueChange={setRetainerId} disabled={!!preselectedRetainerId}>
                <SelectTrigger>
                  <SelectValue placeholder="No retainer linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No retainer linked</SelectItem>
                  {clientRetainers.map((retainer) => (
                    <SelectItem key={retainer.id} value={retainer.id}>
                      {retainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this renewal to a retainer to charge clients alongside retainer dues
              </p>
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
            <Label htmlFor="serviceType">Service Type</Label>
            <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {(data.serviceTypes || []).map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
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
              <Label>Next Renewal Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !nextRenewalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextRenewalDate ? format(nextRenewalDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextRenewalDate}
                    onSelect={(date) => date && setNextRenewalDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
            <Button type="submit" disabled={!clientId || !name || !amount || !nextRenewalDate}>
              Add Renewal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
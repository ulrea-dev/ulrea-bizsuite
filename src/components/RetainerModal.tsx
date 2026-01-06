import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { cn } from '@/lib/utils';

interface RetainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  retainer?: any;
  mode: 'create' | 'edit' | 'view';
}

export const RetainerModal: React.FC<RetainerModalProps> = ({
  isOpen,
  onClose,
  retainer,
  mode
}) => {
  const { dispatch, currentBusiness, data } = useBusiness();
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    description: '',
    status: 'active' as 'active' | 'paused' | 'cancelled',
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

  useEffect(() => {
    if (retainer) {
      setFormData({
        clientId: retainer.clientId,
        name: retainer.name,
        amount: retainer.amount.toString(),
        frequency: retainer.frequency,
        startDate: new Date(retainer.startDate),
        endDate: retainer.endDate ? new Date(retainer.endDate) : undefined,
        description: retainer.description || '',
        status: retainer.status,
      });
    } else {
      setFormData({
        clientId: '',
        name: '',
        amount: '',
        frequency: 'monthly',
        startDate: new Date(),
        endDate: undefined,
        description: '',
        status: 'active',
      });
    }
  }, [retainer]);

  const calculateNextBillingDate = (startDate: Date, frequency: string): string => {
    const now = new Date();
    let nextBilling = new Date(startDate);
    
    while (nextBilling < now) {
      if (frequency === 'monthly') {
        nextBilling = addMonths(nextBilling, 1);
      } else if (frequency === 'quarterly') {
        nextBilling = addMonths(nextBilling, 3);
      } else {
        nextBilling = addYears(nextBilling, 1);
      }
    }
    
    return nextBilling.toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.name.trim() || !formData.amount) {
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    if (mode === 'create') {
      const newRetainer = {
        id: generateId(),
        businessId: currentBusiness?.id || '',
        clientId: formData.clientId,
        name: formData.name.trim(),
        amount,
        currency: currentBusiness?.currency.code || 'USD',
        frequency: formData.frequency,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString(),
        status: formData.status,
        description: formData.description.trim() || undefined,
        nextBillingDate: calculateNextBillingDate(formData.startDate, formData.frequency),
        totalReceived: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_RETAINER', payload: newRetainer });
    } else if (mode === 'edit' && retainer) {
      const updates = {
        clientId: formData.clientId,
        name: formData.name.trim(),
        amount,
        frequency: formData.frequency,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        nextBillingDate: calculateNextBillingDate(formData.startDate, formData.frequency),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ 
        type: 'UPDATE_RETAINER', 
        payload: { id: retainer.id, updates } 
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (retainer && confirm('Are you sure you want to delete this retainer?')) {
      dispatch({ type: 'DELETE_RETAINER', payload: retainer.id });
      onClose();
    }
  };

  const isReadOnly = mode === 'view';
  const clients = data.clients.filter(c => c.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Retainer' : 
             mode === 'edit' ? 'Edit Retainer' : 'Retainer Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Retainer Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Monthly Support Retainer"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currentBusiness?.currency.symbol})</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
                disabled={isReadOnly}
                required
                allowDecimals={true}
                maxDecimals={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                disabled={isReadOnly}
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                    disabled={isReadOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, startDate: date });
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                    disabled={isReadOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, endDate: date });
                      setEndDatePickerOpen(false);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter retainer description"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          <DialogFooter className="flex gap-2">
            {mode === 'view' ? (
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {mode === 'edit' && (
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
                <Button type="submit">
                  {mode === 'create' ? 'Add Retainer' : 'Update Retainer'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

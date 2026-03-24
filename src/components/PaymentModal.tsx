import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  recipientType: 'team' | 'partner';
  recipientId: string;
  recipientName: string;
  payment?: Payment | null;
  mode: 'create' | 'edit' | 'view';
  allocationId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  recipientType, 
  recipientId, 
  recipientName,
  payment, 
  mode,
  allocationId: presetAllocationId
}) => {
  const { data, dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    amount: payment?.amount?.toString() || '',
    description: payment?.description || '',
    allocationId: payment?.allocationId ? payment.allocationId : (presetAllocationId || 'none')
  });
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(
    payment?.date ? new Date(payment.date + 'T00:00:00') : new Date()
  );

  const project = data.projects.find(p => p.id === projectId);
  const availableAllocations = project?.allocations?.filter(allocation => {
    if (recipientType === 'team') {
      return project.allocationTeamAllocations?.some(teamAlloc => 
        teamAlloc.allocationId === allocation.id && teamAlloc.memberId === recipientId
      );
    } else {
      return project.allocationPartnerAllocations?.some(partnerAlloc => 
        partnerAlloc.allocationId === allocation.id && partnerAlloc.partnerId === recipientId
      );
    }
  }) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      const newPayment: Payment = {
        id: `payment_${Date.now()}`,
        amount: parseFloat(formData.amount),
        date: paymentDate ? paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        projectId,
        recipientType,
        type: 'outgoing',
        status: 'completed',
        description: formData.description,
        allocationId: formData.allocationId !== 'none' ? formData.allocationId : undefined,
        ...(recipientType === 'team' ? { memberId: recipientId } : { partnerId: recipientId })
      };

      dispatch({
        type: 'ADD_PAYMENT',
        payload: newPayment
      });
    } else if (mode === 'edit' && payment) {
        dispatch({
          type: 'UPDATE_PAYMENT',
          payload: {
            id: payment.id,
            updates: {
              amount: parseFloat(formData.amount),
              date: paymentDate ? paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              description: formData.description,
              allocationId: formData.allocationId !== 'none' ? formData.allocationId : undefined
            }
          }
        });
    }

    onClose();
  };

  const handleDelete = () => {
    if (payment) {
      dispatch({
        type: 'DELETE_PAYMENT',
        payload: payment.id
      });
      onClose();
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && `Record Payment to ${recipientName}`}
            {mode === 'edit' && 'Edit Payment'}
            {mode === 'view' && 'Payment Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && `Record a payment made to ${recipientName}`}
            {mode === 'edit' && 'Update payment information'}
            {mode === 'view' && 'View payment information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                placeholder="0.00"
                disabled={isReadOnly}
                required
                allowDecimals={true}
                maxDecimals={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isReadOnly}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(d) => d && setPaymentDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {availableAllocations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="allocation">Allocation (Optional)</Label>
              <Select 
                value={formData.allocationId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, allocationId: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select allocation/phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific allocation</SelectItem>
                  {availableAllocations.map((allocation) => (
                    <SelectItem key={allocation.id} value={allocation.id}>
                      {allocation.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional notes about this payment..."
              disabled={isReadOnly}
              rows={3}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {(mode === 'edit' || mode === 'view') && payment && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isReadOnly && (
                <Button type="submit">
                  {mode === 'create' ? 'Record Payment' : 'Update Payment'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

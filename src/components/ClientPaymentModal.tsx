
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Payment } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { Trash2, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  clientId?: string;
  clientName: string;
  payment?: Payment | null;
  mode: 'create' | 'edit' | 'view';
}

export const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  clientId,
  clientName,
  payment, 
  mode 
}) => {
  const { data, dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    amount: payment?.amount?.toString() || '',
    description: payment?.description || ''
  });

  const [paymentDate, setPaymentDate] = useState<Date | undefined>(
    payment?.date ? new Date(payment.date) : new Date()
  );

  const currentProject = data.projects.find(p => p.id === projectId);
  const currentClientPayments = currentProject?.clientPayments || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (mode === 'create') {
      const newPayment: Payment = {
        id: `payment_${Date.now()}`,
        amount: amount,
        date: paymentDate?.toISOString() || new Date().toISOString(),
        projectId,
        clientId,
        recipientType: 'client',
        type: 'incoming',
        status: 'completed',
        description: formData.description
      };

      // Add the payment record
      dispatch({
        type: 'ADD_PAYMENT',
        payload: newPayment
      });

      // Update the project's client payments total
      dispatch({
        type: 'UPDATE_CLIENT_PAYMENTS',
        payload: { 
          projectId, 
          clientPayments: currentClientPayments + amount 
        }
      });
    } else if (mode === 'edit' && payment) {
      const oldAmount = payment.amount;
      const newAmount = amount;
      const difference = newAmount - oldAmount;

      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: { 
          id: payment.id, 
          updates: {
            amount: newAmount,
            date: paymentDate?.toISOString() || new Date().toISOString(),
            description: formData.description
          }
        }
      });

      // Update the project's client payments total by the difference
      dispatch({
        type: 'UPDATE_CLIENT_PAYMENTS',
        payload: { 
          projectId, 
          clientPayments: currentClientPayments + difference 
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

      // Update the project's client payments total by subtracting the payment amount
      dispatch({
        type: 'UPDATE_CLIENT_PAYMENTS',
        payload: { 
          projectId, 
          clientPayments: currentClientPayments - payment.amount 
        }
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
            {mode === 'create' && `Record Payment from ${clientName}`}
            {mode === 'edit' && 'Edit Client Payment'}
            {mode === 'view' && 'Client Payment Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && `Record a payment received from ${clientName}`}
            {mode === 'edit' && 'Update client payment information'}
            {mode === 'view' && 'View client payment information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Received</Label>
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
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                    disabled={isReadOnly}
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
          </div>

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

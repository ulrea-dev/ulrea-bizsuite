
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Payment } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  recipientType: 'team' | 'partner';
  recipientId: string;
  recipientName: string;
  payment?: Payment | null;
  mode: 'create' | 'edit' | 'view';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  recipientType, 
  recipientId, 
  recipientName,
  payment, 
  mode 
}) => {
  const { dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    amount: payment?.amount?.toString() || '',
    date: payment?.date || new Date().toISOString().split('T')[0],
    description: payment?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      const newPayment: Payment = {
        id: `payment_${Date.now()}`,
        amount: parseFloat(formData.amount),
        date: formData.date,
        projectId,
        recipientType,
        type: 'outgoing',
        status: 'completed',
        method: '', // Not needed but keeping for compatibility
        description: formData.description,
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
            date: formData.date,
            description: formData.description
          }
        }
      });
    }

    onClose();
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
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                disabled={isReadOnly}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                disabled={isReadOnly}
                required
              />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit">
                {mode === 'create' ? 'Record Payment' : 'Update Payment'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

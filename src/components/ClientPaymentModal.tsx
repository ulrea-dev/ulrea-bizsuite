import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Payment } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

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
  const { dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    amount: payment?.amount?.toString() || '',
    date: payment?.date || new Date().toISOString().split('T')[0],
    method: payment?.method || '',
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
        clientId,
        recipientType: 'client',
        type: 'incoming',
        status: 'completed',
        method: formData.method,
        description: formData.description
      };

      dispatch({
        type: 'ADD_PAYMENT',
        payload: newPayment
      });

      // Update the project's client payments total
      dispatch({
        type: 'UPDATE_CLIENT_PAYMENTS',
        payload: { 
          projectId, 
          amount: parseFloat(formData.amount) 
        }
      });
    } else if (mode === 'edit' && payment) {
      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: { 
          id: payment.id, 
          updates: {
            amount: parseFloat(formData.amount),
            date: formData.date,
            method: formData.method,
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
            <Label htmlFor="method">Payment Method</Label>
            <Input
              id="method"
              value={formData.method}
              onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
              placeholder="Bank transfer, Cash, Check, etc."
              disabled={isReadOnly}
            />
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
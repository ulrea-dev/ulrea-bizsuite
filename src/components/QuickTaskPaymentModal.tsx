import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { Payment } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

interface QuickTaskPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TASK_TYPES = [
  { value: 'consulting', label: 'Consulting' },
  { value: 'design', label: 'Design Work' },
  { value: 'development', label: 'Development' },
  { value: 'review', label: 'Code Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'meeting', label: 'Meeting/Workshop' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

export const QuickTaskPaymentModal: React.FC<QuickTaskPaymentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data, dispatch, currentBusiness } = useBusiness();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    teamMemberId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    taskType: '',
    taskDescription: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentBusiness) {
      toast({
        title: "Error",
        description: "Please select a business first.",
        variant: "destructive",
      });
      return;
    }

    const selectedMember = data.teamMembers.find(m => m.id === formData.teamMemberId);
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Please select a team member.",
        variant: "destructive",
      });
      return;
    }

    const newPayment: Payment = {
      id: `task_payment_${Date.now()}`,
      amount: parseFloat(formData.amount),
      date: formData.date,
      type: 'outgoing',
      recipientType: 'team',
      status: 'completed',
      memberId: formData.teamMemberId,
      paymentSource: 'task',
      taskType: formData.taskType,
      taskDescription: formData.taskDescription,
      description: formData.description,
    };

    dispatch({
      type: 'ADD_PAYMENT',
      payload: newPayment
    });

    toast({
      title: "Payment Recorded",
      description: `Task payment of ${currentBusiness.currency.symbol}${formData.amount} recorded for ${selectedMember.name}.`,
    });

    // Reset form
    setFormData({
      teamMemberId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      taskType: '',
      taskDescription: '',
      description: '',
    });

    onClose();
  };

  if (!currentBusiness) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Quick Task Payment</DialogTitle>
          <DialogDescription>
            Record a one-time payment for a specific task or quick work completed by a team member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamMember">Team Member</Label>
            <Select 
              value={formData.teamMemberId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, teamMemberId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {data.teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currentBusiness.currency.symbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
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
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type</Label>
            <Select 
              value={formData.taskType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskDescription">Task Description</Label>
            <Textarea
              id="taskDescription"
              value={formData.taskDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, taskDescription: e.target.value }))}
              placeholder="Describe the task completed..."
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Notes (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Any additional notes about this payment..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
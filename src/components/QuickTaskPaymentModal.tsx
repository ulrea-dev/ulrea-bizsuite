import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { Payment, QuickTask } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

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
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const [formData, setFormData] = useState({
    teamMemberId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    taskType: '',
    taskDescription: '',
    description: '',
  });

  const availableTasks = data.quickTasks?.filter(task => 
    task.businessId === currentBusiness?.id && task.status !== 'completed'
  ) || [];

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setSelectedTaskId('');
      setManualMode(false);
      setFormData({
        teamMemberId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        taskType: '',
        taskDescription: '',
        description: '',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-fill form when a task is selected
    if (selectedTaskId && !manualMode) {
      const selectedTask = availableTasks.find(task => task.id === selectedTaskId);
      if (selectedTask) {
        setFormData({
          teamMemberId: selectedTask.assignedToId,
          amount: selectedTask.amount.toString(),
          date: new Date().toISOString().split('T')[0],
          taskType: selectedTask.taskType || '',
          taskDescription: selectedTask.title,
          description: selectedTask.description || '',
        });
      }
    }
  }, [selectedTaskId, availableTasks, manualMode]);

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

    if (!manualMode && !selectedTaskId) {
      toast({
        title: "Error",
        description: "Please select a quick task to pay for.",
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
      taskId: selectedTaskId || undefined,
    };

    dispatch({
      type: 'ADD_PAYMENT',
      payload: newPayment
    });

    // If paying for a specific task, mark it as completed
    if (selectedTaskId && !manualMode) {
      dispatch({
        type: 'COMPLETE_QUICK_TASK',
        payload: { id: selectedTaskId, paidAt: formData.date }
      });
    }

    toast({
      title: "Payment Recorded",
      description: `Task payment of ${currentBusiness.currency.symbol}${formData.amount} recorded for ${selectedMember.name}.`,
    });

    onClose();
  };

  const getAssigneeName = (assignedToId: string) => {
    const member = data.teamMembers.find(m => m.id === assignedToId);
    return member?.name || 'Unknown';
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
          {/* Quick Task Selection */}
          {!manualMode && (
            <div className="space-y-2">
              <Label>Select Quick Task to Pay</Label>
              
              {availableTasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ListChecks className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        No pending quick tasks found. Create tasks in the Quick Tasks section first.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setManualMode(true)}>
                        Switch to Manual Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {availableTasks.map((task) => {
                    const isSelected = selectedTaskId === task.id;
                    return (
                      <Card 
                        key={task.id} 
                        className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {task.taskType || 'Task'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {getAssigneeName(task.assignedToId)}
                                </div>
                                {task.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {format(new Date(task.dueDate), 'MMM dd')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {currentBusiness.currency.symbol}{task.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  <div className="flex justify-center pt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setManualMode(true)}
                    >
                      Switch to Manual Payment Instead
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Mode Toggle */}
          {manualMode && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Manual Payment Mode</p>
                <p className="text-xs text-muted-foreground">Creating a one-time payment not linked to a specific task</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setManualMode(false)}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Use Quick Tasks
              </Button>
            </div>
          )}

          {/* Form Fields */}
          {(manualMode || selectedTaskId) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="teamMember">Team Member</Label>
                <Select 
                  value={formData.teamMemberId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teamMemberId: value }))}
                  required
                  disabled={!manualMode && selectedTaskId !== ''}
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
                    disabled={!manualMode && selectedTaskId !== ''}
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
                  required={manualMode}
                  disabled={!manualMode && selectedTaskId !== ''}
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
                  disabled={!manualMode && selectedTaskId !== ''}
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
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!manualMode && !selectedTaskId}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
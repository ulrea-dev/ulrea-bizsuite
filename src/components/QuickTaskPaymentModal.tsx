import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBusiness } from '@/contexts/BusinessContext';
import { Payment, QuickTask } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Calendar as CalendarIcon, User, ArrowRight, CheckCircle2, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [formData, setFormData] = useState({
    teamMemberId: '',
    amount: '',
    taskType: '',
    taskDescription: '',
    description: '',
  });
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(() => new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [bulkDatePickerOpen, setBulkDatePickerOpen] = useState(false);

  // Helper to check if a task has been paid (via paidAt field set when payment is recorded)
  const isTaskPaid = (task: QuickTask) => {
    return !!task.paidAt;
  };

  const availableTasks = useMemo(() => 
    data.quickTasks?.filter(task => 
      task.businessId === currentBusiness?.id && !isTaskPaid(task)
    ) || [], 
    [data.quickTasks, currentBusiness?.id]
  );

  const getSelectedTasks = useMemo(() => {
    return availableTasks.filter(task => selectedTaskIds.includes(task.id));
  }, [availableTasks, selectedTaskIds]);

  const getTotalAmount = useMemo(() => {
    return getSelectedTasks.reduce((sum, task) => sum + task.amount, 0);
  }, [getSelectedTasks]);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setSelectedTaskIds([]);
      setManualMode(false);
      setBulkMode(false);
      setFormData({
        teamMemberId: '',
        amount: '',
        taskType: '',
        taskDescription: '',
        description: '',
      });
      setPaymentDate(new Date());
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-fill form when a single task is selected in non-bulk mode
    if (selectedTaskIds.length === 1 && !manualMode && !bulkMode) {
      const selectedTask = data.quickTasks?.find(task => task.id === selectedTaskIds[0]);
      if (selectedTask) {
        setFormData(prev => ({
          ...prev,
          teamMemberId: selectedTask.assignedToId,
          amount: selectedTask.amount.toString(),
          taskType: selectedTask.taskType || '',
          taskDescription: selectedTask.title,
          description: selectedTask.description || '',
        }));
      }
    }
  }, [selectedTaskIds, manualMode, bulkMode, data.quickTasks]);

  const handleTaskSelection = useCallback((taskId: string, checked: boolean) => {
    if (bulkMode) {
      setSelectedTaskIds(prev => 
        checked ? [...prev, taskId] : prev.filter(id => id !== taskId)
      );
    } else {
      setSelectedTaskIds(checked ? [taskId] : []);
    }
  }, [bulkMode]);

  const handleSelectAll = useCallback(() => {
    if (selectedTaskIds.length === availableTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(availableTasks.map(task => task.id));
    }
  }, [selectedTaskIds.length, availableTasks]);

  const getAssigneeName = useCallback((assignedToId: string) => {
    const member = data.teamMembers.find(m => m.id === assignedToId);
    return member?.name || 'Unknown';
  }, [data.teamMembers]);

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

    if (!manualMode && selectedTaskIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one quick task to pay for.",
        variant: "destructive",
      });
      return;
    }

    if (bulkMode && selectedTaskIds.length > 0) {
      // Handle bulk payment
      const totalAmount = getTotalAmount;
      
      // Group tasks by team member for bulk payments
      const tasksByMember = getSelectedTasks.reduce((acc, task) => {
        if (!acc[task.assignedToId]) {
          acc[task.assignedToId] = [];
        }
        acc[task.assignedToId].push(task);
        return acc;
      }, {} as Record<string, QuickTask[]>);

      // Create payment for each team member
      Object.entries(tasksByMember).forEach(([memberId, memberTasks]) => {
        const memberAmount = memberTasks.reduce((sum, task) => sum + task.amount, 0);
        const member = data.teamMembers.find(m => m.id === memberId);
        
        const newPayment: Payment = {
          id: `bulk_task_payment_${Date.now()}_${memberId}`,
          amount: memberAmount,
          date: paymentDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          type: 'outgoing',
          recipientType: 'team',
          status: 'completed',
          memberId: memberId,
          paymentSource: 'task',
          taskType: 'bulk',
          taskDescription: `Bulk payment for ${memberTasks.length} tasks`,
          description: `Bulk payment for: ${memberTasks.map(t => t.title).join(', ')}`,
          taskId: undefined,
        };

        dispatch({
          type: 'ADD_PAYMENT',
          payload: newPayment
        });

        // Mark all tasks as paid
        memberTasks.forEach(task => {
          dispatch({
            type: 'UPDATE_QUICK_TASK',
            payload: { 
              id: task.id, 
              updates: { 
                paidAt: paymentDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString()
              }
            }
          });
        });
      });

      toast({
        title: "Bulk Payment Recorded",
        description: `${selectedTaskIds.length} tasks paid for total of ${currentBusiness.currency.symbol}${totalAmount.toFixed(2)}.`,
      });

    } else {
      // Handle single payment or manual payment
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
        date: paymentDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        type: 'outgoing',
        recipientType: 'team',
        status: 'completed',
        memberId: formData.teamMemberId,
        paymentSource: 'task',
        taskType: formData.taskType,
        taskDescription: formData.taskDescription,
        description: formData.description,
        taskId: selectedTaskIds[0] || undefined,
      };

      dispatch({
        type: 'ADD_PAYMENT',
        payload: newPayment
      });

      // If paying for a specific task, mark it as paid
      if (selectedTaskIds.length === 1 && !manualMode) {
        dispatch({
          type: 'UPDATE_QUICK_TASK',
          payload: { 
            id: selectedTaskIds[0], 
            updates: { 
              paidAt: paymentDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString()
            }
          }
        });
      }

      toast({
        title: "Payment Recorded",
        description: `Task payment of ${currentBusiness.currency.symbol}${formData.amount} recorded for ${selectedMember.name}.`,
      });
    }

    onClose();
  };

  if (!currentBusiness) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Record Quick Task Payment</DialogTitle>
          <DialogDescription>
            Record payment for completed tasks or create manual payments for team members.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selection */}
            {!manualMode && availableTasks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={!bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedTaskIds(selectedTaskIds.slice(0, 1));
                  }}
                >
                  Single Payment
                </Button>
                <Button
                  type="button"
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode(true)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Bulk Payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualMode(true)}
                >
                  Manual Payment
                </Button>
              </div>
            )}

            {/* Quick Task Selection */}
            {!manualMode && (
              <div className="space-y-4">
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
                  <>
                    {/* Bulk Selection Controls */}
                    {bulkMode && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedTaskIds.length === availableTasks.length}
                            onCheckedChange={handleSelectAll}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {selectedTaskIds.length} of {availableTasks.length} tasks selected
                            </p>
                             <p className="text-xs text-muted-foreground">
                               Total: {currentBusiness.currency.symbol}{getTotalAmount.toFixed(2)}
                             </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedTaskIds.length === availableTasks.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    )}

                    {/* Task List */}
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {availableTasks.map((task) => {
                        const isSelected = selectedTaskIds.includes(task.id);
                        return (
                          <Card 
                            key={task.id} 
                            className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                            onClick={() => handleTaskSelection(task.id, !isSelected)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium truncate">{task.title}</h4>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          {task.taskType || 'Task'}
                                        </Badge>
                                        {task.status === 'completed' && (
                                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Completed
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          <span className="truncate">{getAssigneeName(task.assignedToId)}</span>
                                        </div>
                                        {task.dueDate && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Due: {format(new Date(task.dueDate), 'MMM dd')}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="text-right shrink-0">
                                      <div className="font-medium">
                                        {currentBusiness.currency.symbol}{task.amount.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Manual Mode */}
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
            {(manualMode || selectedTaskIds.length > 0) && !bulkMode && (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamMember">Team Member</Label>
                  <Select 
                    value={formData.teamMemberId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, teamMemberId: value }))}
                    required
                    disabled={!manualMode && selectedTaskIds.length === 1}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({currentBusiness.currency.symbol})</Label>
                    <CurrencyInput
                      id="amount"
                      value={formData.amount}
                      onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                      placeholder="0.00"
                      allowDecimals={true}
                      maxDecimals={2}
                      required
                      disabled={!manualMode && selectedTaskIds.length === 1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Payment Date</Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !paymentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {paymentDate ? format(paymentDate, "MMM dd, yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="pointer-events-auto">
                          <Calendar
                            mode="single"
                            selected={paymentDate}
                            onSelect={(date) => {
                              setPaymentDate(date);
                              setDatePickerOpen(false);
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select 
                    value={formData.taskType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}
                    required={manualMode}
                    disabled={!manualMode && selectedTaskIds.length === 1}
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
                    disabled={!manualMode && selectedTaskIds.length === 1}
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
              </div>
            )}

            {/* Bulk Payment Summary */}
            {bulkMode && selectedTaskIds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Bulk Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Selected Tasks:</span>
                      <span className="font-medium">{selectedTaskIds.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Amount:</span>
                       <span className="font-medium text-lg">
                         {currentBusiness.currency.symbol}{getTotalAmount.toFixed(2)}
                       </span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bulkDate">Payment Date</Label>
                      <Popover open={bulkDatePickerOpen} onOpenChange={setBulkDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !paymentDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {paymentDate ? format(paymentDate, "MMM dd, yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="pointer-events-auto">
                            <Calendar
                              mode="single"
                              selected={paymentDate}
                              onSelect={(date) => {
                                setPaymentDate(date);
                                setBulkDatePickerOpen(false);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!manualMode && selectedTaskIds.length === 0}
            onClick={handleSubmit}
          >
             {bulkMode && selectedTaskIds.length > 0 
               ? `Pay ${selectedTaskIds.length} Tasks (${currentBusiness.currency.symbol}${getTotalAmount.toFixed(2)})`
               : 'Record Payment'
             }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
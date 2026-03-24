import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBusiness } from '@/contexts/BusinessContext';
import { Payment, QuickTask } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ListChecks, User, CheckCircle2, Users, DollarSign, Calendar as CalendarLucideIcon, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/storage';

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

export const QuickTaskPaymentsPage: React.FC = () => {
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
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

  const isTaskPaid = (task: QuickTask) => !!task.paidAt;

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

  const handleTaskSelection = useCallback((taskId: string, checked: boolean) => {
    if (bulkMode) {
      setSelectedTaskIds(prev => 
        checked ? [...prev, taskId] : prev.filter(id => id !== taskId)
      );
    } else {
      setSelectedTaskIds(checked ? [taskId] : []);
      // Auto-fill form when single task selected
      if (checked) {
        const selectedTask = data.quickTasks?.find(task => task.id === taskId);
        if (selectedTask) {
          setFormData({
            teamMemberId: selectedTask.assignedToId,
            amount: selectedTask.amount.toString(),
            taskType: selectedTask.taskType || '',
            taskDescription: selectedTask.title,
            description: selectedTask.description || '',
          });
        }
      }
    }
  }, [bulkMode, data.quickTasks]);

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

  const resetForm = () => {
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
  };

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

    const dateToUse = paymentDate ? paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    if (bulkMode && selectedTaskIds.length > 0) {
      const totalAmount = getTotalAmount;
      
      const tasksByMember = getSelectedTasks.reduce((acc, task) => {
        if (!acc[task.assignedToId]) {
          acc[task.assignedToId] = [];
        }
        acc[task.assignedToId].push(task);
        return acc;
      }, {} as Record<string, QuickTask[]>);

      Object.entries(tasksByMember).forEach(([memberId, memberTasks]) => {
        const memberAmount = memberTasks.reduce((sum, task) => sum + task.amount, 0);
        
        const newPayment: Payment = {
          id: `bulk_task_payment_${Date.now()}_${memberId}`,
          amount: memberAmount,
          date: dateToUse,
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

        dispatch({ type: 'ADD_PAYMENT', payload: newPayment });

        memberTasks.forEach(task => {
          dispatch({
            type: 'UPDATE_QUICK_TASK',
            payload: { 
              id: task.id, 
              updates: { 
                paidAt: dateToUse,
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
        date: dateToUse,
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

      dispatch({ type: 'ADD_PAYMENT', payload: newPayment });

      if (selectedTaskIds.length === 1 && !manualMode) {
        dispatch({
          type: 'UPDATE_QUICK_TASK',
          payload: { 
            id: selectedTaskIds[0], 
            updates: { 
              paidAt: dateToUse,
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

    resetForm();
  };

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Quick Task Payments</h2>
        <p className="text-sm text-muted-foreground">
          Record payments for completed freelance tasks or create manual payments for team members.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(availableTasks.reduce((sum, t) => sum + t.amount, 0), currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Amount</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalAmount, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Tasks</CardTitle>
            <CardDescription>Choose tasks to pay for or switch to manual mode.</CardDescription>
            
            {/* Mode Selection */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant={!bulkMode && !manualMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBulkMode(false);
                  setManualMode(false);
                  setSelectedTaskIds(selectedTaskIds.slice(0, 1));
                }}
              >
                Single Payment
              </Button>
              <Button
                type="button"
                variant={bulkMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBulkMode(true);
                  setManualMode(false);
                }}
              >
                <Users className="h-4 w-4 mr-1" />
                Bulk Payment
              </Button>
              <Button
                type="button"
                variant={manualMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setManualMode(true);
                  setBulkMode(false);
                  setSelectedTaskIds([]);
                }}
              >
                Manual Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {manualMode ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Manual payment mode - fill out the form on the right.</p>
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-8">
                <ListChecks className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  No pending quick tasks found.
                </p>
                <Button variant="outline" size="sm" onClick={() => setManualMode(true)}>
                  Switch to Manual Payment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bulk Selection Controls */}
                {bulkMode && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTaskIds.length === availableTasks.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm">
                        {selectedTaskIds.length} of {availableTasks.length} selected
                      </span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedTaskIds.length === availableTasks.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                )}

                {/* Task List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {availableTasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleTaskSelection(task.id, !isSelected)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
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
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{getAssigneeName(task.assignedToId)}</span>
                              </div>
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <CalendarLucideIcon className="h-3 w-3" />
                                  <span>Due: {format(new Date(task.dueDate), 'MMM dd')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="font-medium shrink-0">
                            {currentBusiness.currency.symbol}{task.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {bulkMode ? 'Bulk Payment Details' : manualMode ? 'Manual Payment' : 'Payment Details'}
            </CardTitle>
            <CardDescription>
              {bulkMode 
                ? 'Review and confirm bulk payment for selected tasks.'
                : manualMode 
                  ? 'Create a manual payment not linked to any task.'
                  : 'Confirm payment details for the selected task.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {bulkMode && selectedTaskIds.length > 0 ? (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Selected Tasks:</span>
                      <span className="font-medium">{selectedTaskIds.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-bold text-lg">
                        {currentBusiness.currency.symbol}{getTotalAmount.toFixed(2)}
                      </span>
                    </div>
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
                </>
              ) : (
                <>
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

                  <div className="grid grid-cols-2 gap-4">
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
                      <Label>Payment Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
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
                      placeholder="Any additional notes..."
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Reset
                </Button>
                <Button 
                  type="submit" 
                  disabled={!manualMode && selectedTaskIds.length === 0}
                  className="flex-1"
                >
                  {bulkMode && selectedTaskIds.length > 0 
                    ? `Pay ${selectedTaskIds.length} Tasks`
                    : 'Record Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

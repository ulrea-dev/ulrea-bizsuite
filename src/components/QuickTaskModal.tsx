import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { QuickTask } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { generateId } from '@/utils/storage';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: QuickTask | null;
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

export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const { data, dispatch, currentBusiness } = useBusiness();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    assignedToId: '',
    status: 'pending' as 'pending' | 'active' | 'completed',
    taskType: '',
    description: '',
  });

  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        amount: task.amount.toString(),
        assignedToId: task.assignedToId,
        status: task.status,
        taskType: task.taskType || '',
        description: task.description || '',
      });
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    } else {
      setFormData({
        title: '',
        amount: '',
        assignedToId: '',
        status: 'pending',
        taskType: '',
        description: '',
      });
      setDueDate(undefined);
    }
  }, [task, isOpen]);

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

    const selectedMember = data.teamMembers.find(m => m.id === formData.assignedToId);
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Please select a team member.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();

    if (task) {
      // Update existing task
      dispatch({
        type: 'UPDATE_QUICK_TASK',
        payload: {
          id: task.id,
          updates: {
            title: formData.title,
            amount: parseFloat(formData.amount),
            assignedToId: formData.assignedToId,
            dueDate: dueDate?.toISOString(),
            status: formData.status,
            taskType: formData.taskType || undefined,
            description: formData.description || undefined,
          }
        }
      });

      toast({
        title: "Task Updated",
        description: `Task "${formData.title}" has been updated.`,
      });
    } else {
      // Create new task
      const newTask: QuickTask = {
        id: generateId(),
        businessId: currentBusiness.id,
        title: formData.title,
        amount: parseFloat(formData.amount),
        currencyCode: currentBusiness.currency.code,
        assignedToId: formData.assignedToId,
        dueDate: dueDate?.toISOString(),
        status: formData.status,
        taskType: formData.taskType || undefined,
        description: formData.description || undefined,
        createdAt: now,
        updatedAt: now,
      };

      dispatch({
        type: 'ADD_QUICK_TASK',
        payload: newTask
      });

      toast({
        title: "Task Created",
        description: `New task "${formData.title}" assigned to ${selectedMember.name}.`,
      });
    }

    onClose();
  };

  if (!currentBusiness) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Quick Task' : 'Create Quick Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the task details below.' : 'Create a new one-time task for a team member.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Create landing page design"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select 
                value={formData.taskType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'pending' | 'active' | 'completed') => setFormData(prev => ({ ...prev, status: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select 
              value={formData.assignedToId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
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
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                placeholder="0.00"
                required
                allowDecimals={true}
                maxDecimals={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
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
              placeholder="Additional details about this task..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
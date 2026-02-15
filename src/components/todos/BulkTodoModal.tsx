import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X, ListPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';
import { useRepository } from '@/repositories';
import { ToDo, ToDoPriority, ToDoAssignee } from '@/types/business';
import { AssigneeSelector } from './AssigneeSelector';
import { useToast } from '@/hooks/use-toast';

interface BulkTodoModalProps {
  open: boolean;
  onClose: () => void;
}

interface TaskLine {
  id: string;
  title: string;
  priority: ToDoPriority;
}

export const BulkTodoModal: React.FC<BulkTodoModalProps> = ({ open, onClose }) => {
  const { data, dispatch } = useBusiness();
  const { repository } = useRepository();
  const { toast } = useToast();
  const lastInputRef = useRef<HTMLInputElement>(null);

  // Shared presets
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [businessId, setBusinessId] = useState<string>('');
  const [assignees, setAssignees] = useState<ToDoAssignee[]>([]);
  const [defaultPriority, setDefaultPriority] = useState<ToDoPriority>('medium');

  // Task lines
  const [tasks, setTasks] = useState<TaskLine[]>([
    { id: '1', title: '', priority: 'medium' },
  ]);

  useEffect(() => {
    if (open) {
      setDueDate(new Date());
      setBusinessId(data.currentBusinessId || '');
      setAssignees([]);
      setDefaultPriority('medium');
      setTasks([{ id: '1', title: '', priority: 'medium' }]);
    }
  }, [open, data.currentBusinessId]);

  // Focus the last input when a new line is added
  useEffect(() => {
    lastInputRef.current?.focus();
  }, [tasks.length]);

  const updateTask = (id: string, field: keyof TaskLine, value: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const removeTask = (id: string) => {
    if (tasks.length <= 1) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addLine = useCallback(() => {
    setTasks(prev => [
      ...prev,
      { id: Date.now().toString(), title: '', priority: defaultPriority },
    ]);
  }, [defaultPriority]);

  const handleKeyDown = (e: React.KeyboardEvent, taskId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const task = tasks.find(t => t.id === taskId);
      if (task?.title.trim()) {
        addLine();
      }
    }
  };

  const handleSubmit = () => {
    const validTasks = tasks.filter(t => t.title.trim());
    if (validTasks.length === 0) return;

    const now = new Date().toISOString();
    const dueDateStr = dueDate.toISOString().split('T')[0];

    validTasks.forEach(task => {
      const newTodo: ToDo = {
        id: repository.generateId(),
        title: task.title.trim(),
        dueDate: dueDateStr,
        priority: task.priority,
        businessId: businessId || undefined,
        assignees,
        linkType: 'general',
        status: 'pending',
        createdBy: data.userSettings.userId,
        createdByName: data.userSettings.username || 'Unknown',
        createdAt: now,
        updatedAt: now,
      } as ToDo;

      dispatch({ type: 'ADD_TODO', payload: newTodo });
    });

    toast({
      title: 'Tasks created',
      description: `${validTasks.length} task${validTasks.length > 1 ? 's' : ''} added.`,
    });
    onClose();
  };

  const validCount = tasks.filter(t => t.title.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5" />
            Bulk Add Tasks
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Presets row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dueDate ? format(dueDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setDueDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Business</Label>
              <Select value={businessId || "__all__"} onValueChange={(v) => setBusinessId(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All businesses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Businesses</SelectItem>
                  {data.businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Default Priority</Label>
              <Select value={defaultPriority} onValueChange={(v) => setDefaultPriority(v as ToDoPriority)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignees */}
          <AssigneeSelector
            assignees={assignees}
            businessId={businessId}
            onChange={setAssignees}
          />

          {/* Task lines */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tasks</Label>
            <div className="space-y-1.5">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <Input
                    ref={index === tasks.length - 1 ? lastInputRef : undefined}
                    value={task.title}
                    onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, task.id)}
                    placeholder="Task title — press Enter to add next"
                    className="flex-1 h-9"
                  />
                  <Select
                    value={task.priority}
                    onValueChange={(v) => updateTask(task.id, 'priority', v)}
                  >
                    <SelectTrigger className="w-[90px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Med</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="urgent">🔴 Urg</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeTask(task.id)}
                    disabled={tasks.length <= 1}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Another Line
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {validCount} task{validCount !== 1 ? 's' : ''} ready
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={validCount === 0}>
                Create {validCount > 0 ? validCount : ''} Task{validCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

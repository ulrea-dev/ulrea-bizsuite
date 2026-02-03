import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';
import { useRepository } from '@/repositories';
import { ToDo, ToDoPriority, ToDoLinkType, ToDoAssigneeType } from '@/types/business';
import { AssigneeSelector } from '@/components/todos/AssigneeSelector';
import { EntityLinkSelector } from '@/components/todos/EntityLinkSelector';

interface TodoModalProps {
  open: boolean;
  onClose: () => void;
  todo?: ToDo | null;
}

export const TodoModal: React.FC<TodoModalProps> = ({ open, onClose, todo }) => {
  const { data, dispatch } = useBusiness();
  const { repository } = useRepository();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [priority, setPriority] = useState<ToDoPriority>('medium');
  const [businessId, setBusinessId] = useState<string>('');
  const [assigneeType, setAssigneeType] = useState<ToDoAssigneeType>('self');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assigneeName, setAssigneeName] = useState<string>('');
  const [linkType, setLinkType] = useState<ToDoLinkType>('general');
  const [linkedEntityId, setLinkedEntityId] = useState<string>('');
  const [linkedEntityName, setLinkedEntityName] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (todo) {
        setTitle(todo.title);
        setDescription(todo.description || '');
        setDueDate(new Date(todo.dueDate));
        setPriority(todo.priority);
        setBusinessId(todo.businessId || '');
        setAssigneeType(todo.assigneeType);
        setAssigneeId(todo.assigneeId || '');
        setAssigneeName(todo.assigneeName || '');
        setLinkType(todo.linkType);
        setLinkedEntityId(todo.linkedEntityId || '');
        setLinkedEntityName(todo.linkedEntityName || '');
        setNotes(todo.notes || '');
      } else {
        setTitle('');
        setDescription('');
        setDueDate(new Date());
        setPriority('medium');
        setBusinessId(data.currentBusinessId || '');
        setAssigneeType('self');
        setAssigneeId('');
        setAssigneeName('');
        setLinkType('general');
        setLinkedEntityId('');
        setLinkedEntityName('');
        setNotes('');
      }
    }
  }, [open, todo, data.currentBusinessId]);

  const handleAssigneeSelect = (
    type: ToDoAssigneeType, 
    id?: string, 
    name?: string
  ) => {
    setAssigneeType(type);
    setAssigneeId(id || '');
    setAssigneeName(name || '');
  };

  const handleEntitySelect = (
    type: ToDoLinkType, 
    id?: string, 
    name?: string
  ) => {
    setLinkType(type);
    setLinkedEntityId(id || '');
    setLinkedEntityName(name || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const now = new Date().toISOString();
    const todoData: Partial<ToDo> = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate.toISOString().split('T')[0],
      priority,
      businessId: businessId || undefined,
      assigneeType,
      assigneeId: assigneeId || undefined,
      assigneeName: assigneeName || undefined,
      linkType,
      linkedEntityId: linkedEntityId || undefined,
      linkedEntityName: linkedEntityName || undefined,
      notes: notes.trim() || undefined,
      updatedAt: now,
    };

    if (todo) {
      dispatch({
        type: 'UPDATE_TODO',
        payload: { id: todo.id, updates: todoData },
      });
    } else {
      const newTodo: ToDo = {
        id: repository.generateId(),
        ...todoData,
        status: 'pending',
        createdBy: data.userSettings.userId,
        createdAt: now,
        updatedAt: now,
      } as ToDo;
      
      dispatch({ type: 'ADD_TODO', payload: newTodo });
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{todo ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          {/* Due Date and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
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
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
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

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ToDoPriority)}>
                <SelectTrigger>
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

          {/* Business */}
          <div className="space-y-2">
            <Label>Business</Label>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger>
                <SelectValue placeholder="All businesses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Businesses</SelectItem>
                {data.businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Selector */}
          <AssigneeSelector
            assigneeType={assigneeType}
            assigneeId={assigneeId}
            businessId={businessId}
            onSelect={handleAssigneeSelect}
          />

          {/* Entity Link Selector */}
          <EntityLinkSelector
            linkType={linkType}
            linkedEntityId={linkedEntityId}
            businessId={businessId}
            onSelect={handleEntitySelect}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {todo ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

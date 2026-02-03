import React, { useState, useMemo } from 'react';
import { Check, MoreHorizontal, CalendarClock, Users, Link2, Pencil, Trash2, ArrowRight, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBusiness } from '@/contexts/BusinessContext';
import { ToDo, ToDoPriority, ToDoAssignee } from '@/types/business';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { TodoModal } from '@/components/TodoModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { migrateTodoAssignees, getAssigneeDisplayNames } from '@/utils/todoMigration';

interface TodoItemProps {
  todo: ToDo;
  compact?: boolean;
  showDate?: boolean;
}

const priorityColors: Record<ToDoPriority, string> = {
  low: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const priorityIcons: Record<ToDoPriority, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴',
};

export const TodoItem: React.FC<TodoItemProps> = ({ todo: rawTodo, compact, showDate }) => {
  const { dispatch } = useBusiness();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Migrate legacy single-assignee to array format
  const todo = useMemo(() => migrateTodoAssignees(rawTodo), [rawTodo]);
  const assignees = todo.assignees || [];

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = todo.dueDate < today && todo.status === 'pending';
  const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(todo.dueDate)) : 0;

  const handleComplete = () => {
    if (todo.isRecurring) {
      dispatch({ type: 'COMPLETE_RECURRING_TODO', payload: todo.id });
    } else {
      dispatch({ type: 'COMPLETE_TODO', payload: todo.id });
    }
  };

  const handleCarryForward = () => {
    const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];
    dispatch({
      type: 'CARRY_FORWARD_TODO',
      payload: { id: todo.id, newDueDate: tomorrow },
    });
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_TODO', payload: todo.id });
    setIsDeleteDialogOpen(false);
  };

  if (compact) {
    return (
      <>
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg border transition-colors hover:bg-muted/50",
            isOverdue && "border-destructive/50 bg-destructive/5",
            todo.status === 'done' && "opacity-60"
          )}
        >
          <Checkbox
            checked={todo.status === 'done'}
            onCheckedChange={handleComplete}
            disabled={todo.status === 'done'}
          />
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              todo.status === 'done' && "line-through text-muted-foreground"
            )}>
              {todo.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {assignees.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {getAssigneeDisplayNames(assignees, 2)}
                </span>
              )}
              {todo.linkedEntityName && (
                <span className="flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {todo.linkedEntityName}
                </span>
              )}
              {showDate && (
                <span>{format(new Date(todo.dueDate), 'MMM d')}</span>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  {daysOverdue}d overdue
                </Badge>
              )}
              {todo.isRecurring && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Repeat className="h-3 w-3 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Repeats {todo.recurringPattern}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <span className="text-sm">{priorityIcons[todo.priority]}</span>
        </div>
        <TodoModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} todo={todo} />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-lg border transition-colors hover:bg-muted/50",
          isOverdue && "border-destructive/50 bg-destructive/5",
          todo.status === 'done' && "opacity-60"
        )}
      >
        <Checkbox
          checked={todo.status === 'done'}
          onCheckedChange={handleComplete}
          disabled={todo.status === 'done'}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className={cn(
              "font-medium",
              todo.status === 'done' && "line-through text-muted-foreground"
            )}>
              {todo.title}
            </p>
            <Badge variant="outline" className={cn("text-xs", priorityColors[todo.priority])}>
              {todo.priority}
            </Badge>
            {todo.isRecurring && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Repeat className="h-3 w-3" />
                      {todo.recurringPattern}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Repeats {todo.recurringPattern}
                    {todo.recurringEndDate && ` until ${format(new Date(todo.recurringEndDate), 'MMM d, yyyy')}`}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {todo.description && (
            <p className="text-sm text-muted-foreground">{todo.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {assignees.length > 0 && (
              assignees.length > 3 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-default">
                        <Users className="h-3 w-3" />
                        {getAssigneeDisplayNames(assignees, 3)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        {assignees.map(a => (
                          <div key={`${a.type}-${a.id}`}>{a.name}</div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {getAssigneeDisplayNames(assignees, 3)}
                </span>
              )
            )}
            {todo.linkedEntityName && (
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {todo.linkType}: {todo.linkedEntityName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {format(new Date(todo.dueDate), 'MMM d, yyyy')}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
              </Badge>
            )}
            {todo.originalDueDate && todo.originalDueDate !== todo.dueDate && (
              <Badge variant="outline" className="text-xs">
                Originally: {format(new Date(todo.originalDueDate), 'MMM d')}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {todo.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={handleComplete}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Done
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCarryForward}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to Tomorrow
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TodoModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} todo={todo} />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{todo.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

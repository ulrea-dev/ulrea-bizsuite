import React, { useState, useMemo } from 'react';
import { Plus, ArrowRight, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/contexts/BusinessContext';
import { TodoModal } from '@/components/TodoModal';
import { BulkTodoModal } from './BulkTodoModal';
import { TodoItem } from './TodoItem';
import { format, addDays } from 'date-fns';

export const TodayPage: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { overdueTasks, todayTasks, completedToday } = useMemo(() => {
    const todos = data.todos || [];
    const pending = todos.filter(t => t.status === 'pending');
    
    const overdue = pending
      .filter(t => t.dueDate < today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    
    const dueToday = pending
      .filter(t => t.dueDate === today)
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    const completed = todos
      .filter(t => t.status === 'done' && t.completedAt)
      .filter(t => t.completedAt!.startsWith(today))
      .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));

    return {
      overdueTasks: overdue,
      todayTasks: dueToday,
      completedToday: completed,
    };
  }, [data.todos, today]);

  const handleCarryAllForward = () => {
    const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];
    const ids = overdueTasks.map(t => t.id);
    dispatch({
      type: 'BULK_CARRY_FORWARD_TODOS',
      payload: { ids, newDueDate: tomorrow },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
            <ListPlus className="h-4 w-4 mr-2" />
            Bulk Add
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        {todayTasks.length + overdueTasks.length} task{todayTasks.length + overdueTasks.length !== 1 ? 's' : ''} remaining
        {completedToday.length > 0 && ` • ${completedToday.length} completed today`}
      </div>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide flex items-center gap-2">
              ⚠️ Overdue ({overdueTasks.length})
            </h2>
            <Button variant="outline" size="sm" onClick={handleCarryAllForward}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Move All to Tomorrow
            </Button>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}

      {/* Due Today Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Due Today ({todayTasks.length})
        </h2>
        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks due today!</p>
            <Button 
              variant="link" 
              onClick={() => setIsModalOpen(true)}
              className="mt-2"
            >
              Add a task
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Today Section */}
      {completedToday.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            ✓ Completed Today ({completedToday.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {completedToday.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}

      <TodoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BulkTodoModal open={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
    </div>
  );
};

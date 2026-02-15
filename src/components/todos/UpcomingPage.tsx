import React, { useState, useMemo } from 'react';
import { Plus, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/contexts/BusinessContext';
import { TodoModal } from '@/components/TodoModal';
import { BulkTodoModal } from './BulkTodoModal';
import { TodoItem } from './TodoItem';
import { format, addDays, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

export const UpcomingPage: React.FC = () => {
  const { data } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { thisWeekTasks, nextWeekTasks, laterTasks } = useMemo(() => {
    const todos = data.todos || [];
    const pending = todos.filter(t => t.status === 'pending' && t.dueDate > today);

    const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
    const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }).toISOString().split('T')[0];
    const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }).toISOString().split('T')[0];

    const thisWeek = pending
      .filter(t => t.dueDate <= thisWeekEnd)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const nextWeek = pending
      .filter(t => t.dueDate >= nextWeekStart && t.dueDate <= nextWeekEnd)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const later = pending
      .filter(t => t.dueDate > nextWeekEnd)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      thisWeekTasks: thisWeek,
      nextWeekTasks: nextWeek,
      laterTasks: later,
    };
  }, [data.todos, today]);

  const totalUpcoming = thisWeekTasks.length + nextWeekTasks.length + laterTasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upcoming</h1>
          <p className="text-muted-foreground">
            {totalUpcoming} upcoming task{totalUpcoming !== 1 ? 's' : ''}
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

      {totalUpcoming === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium">No upcoming tasks</h3>
          <p className="text-muted-foreground">Schedule some tasks to see them here.</p>
          <Button 
            variant="link" 
            onClick={() => setIsModalOpen(true)}
            className="mt-2"
          >
            Add a task
          </Button>
        </div>
      ) : (
        <>
          {/* This Week */}
          {thisWeekTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                This Week ({thisWeekTasks.length})
              </h2>
              <div className="space-y-2">
                {thisWeekTasks.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} showDate />
                ))}
              </div>
            </div>
          )}

          {/* Next Week */}
          {nextWeekTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Next Week ({nextWeekTasks.length})
              </h2>
              <div className="space-y-2">
                {nextWeekTasks.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} showDate />
                ))}
              </div>
            </div>
          )}

          {/* Later */}
          {laterTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Later ({laterTasks.length})
              </h2>
              <div className="space-y-2">
                {laterTasks.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} showDate />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <TodoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BulkTodoModal open={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
    </div>
  );
};

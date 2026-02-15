import React, { useState, useMemo } from 'react';
import { Plus, ArrowRight, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/contexts/BusinessContext';
import { TodoModal } from '@/components/TodoModal';
import { BulkTodoModal } from './BulkTodoModal';
import { TodoItem } from './TodoItem';
import { addDays } from 'date-fns';

export const OverduePage: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const overdueTasks = useMemo(() => {
    const todos = data.todos || [];
    return todos
      .filter(t => t.status === 'pending' && t.dueDate < today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data.todos, today]);

  const handleCarryAllToday = () => {
    const ids = overdueTasks.map(t => t.id);
    dispatch({
      type: 'BULK_CARRY_FORWARD_TODOS',
      payload: { ids, newDueDate: today },
    });
  };

  const handleCarryAllTomorrow = () => {
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
          <h1 className="text-2xl font-bold text-foreground">Overdue Tasks</h1>
          <p className="text-muted-foreground">
            Tasks that need your attention
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

      {overdueTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground">You have no overdue tasks.</p>
        </div>
      ) : (
        <>
          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCarryAllToday}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Reschedule All to Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleCarryAllTomorrow}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Reschedule All to Tomorrow
            </Button>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {overdueTasks.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </>
      )}

      <TodoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BulkTodoModal open={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
    </div>
  );
};

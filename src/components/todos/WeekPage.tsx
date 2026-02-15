import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/contexts/BusinessContext';
import { TodoModal } from '@/components/TodoModal';
import { BulkTodoModal } from './BulkTodoModal';
import { TodoItem } from './TodoItem';
import { DraggableTodoItem } from './DraggableTodoItem';
import { DroppableDay } from './DroppableDay';
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ToDo } from '@/types/business';
import { toast } from 'sonner';

export const WeekPage: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [activeTask, setActiveTask] = useState<ToDo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const tasksByDay = useMemo(() => {
    const todos = data.todos || [];
    const pending = todos.filter(t => t.status === 'pending');

    const byDay: Record<string, typeof todos> = {};
    daysOfWeek.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      byDay[dateStr] = pending.filter(t => t.dueDate === dateStr);
    });

    return byDay;
  }, [data.todos, daysOfWeek]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek = isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleDragStart = (event: DragStartEvent) => {
    const todo = event.active.data.current?.todo as ToDo;
    setActiveTask(todo);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const todoId = active.id as string;
    const newDate = over.id as string;
    const todo = (data.todos || []).find(t => t.id === todoId);

    if (!todo || todo.dueDate === newDate) return;

    dispatch({
      type: 'CARRY_FORWARD_TODO',
      payload: { id: todoId, newDueDate: newDate },
    });

    toast.success(`Task moved to ${format(new Date(newDate), 'EEEE, MMM d')}`);
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">This Week</h1>
            <p className="text-muted-foreground">
              {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {!isCurrentWeek && (
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
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
        </div>

        {/* Drag instruction */}
        <p className="text-sm text-muted-foreground">
          💡 Drag tasks between days to reschedule them
        </p>

        {/* Week View */}
        <div className="grid gap-4">
          {daysOfWeek.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const tasks = tasksByDay[dateStr] || [];
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date() && !isToday;

            return (
              <DroppableDay
                key={dateStr}
                date={day}
                dateStr={dateStr}
                isToday={isToday}
                isPast={isPast}
                taskCount={tasks.length}
              >
                {tasks.length > 0 && (
                  <div className="space-y-2">
                    {tasks.map((todo) => (
                      <DraggableTodoItem key={todo.id} todo={todo} />
                    ))}
                  </div>
                )}
              </DroppableDay>
            );
          })}
        </div>

        <TodoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <BulkTodoModal open={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="opacity-90 shadow-lg">
            <TodoItem todo={activeTask} compact />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

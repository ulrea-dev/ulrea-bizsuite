import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/contexts/BusinessContext';
import { TodoModal } from '@/components/TodoModal';
import { TodoItem } from './TodoItem';
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay } from 'date-fns';

export const WeekPage: React.FC = () => {
  const { data } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
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

  return (
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Week View */}
      <div className="grid gap-4">
        {daysOfWeek.map((day) => {
          const dateStr = day.toISOString().split('T')[0];
          const tasks = tasksByDay[dateStr] || [];
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date() && !isToday;

          return (
            <div 
              key={dateStr} 
              className={`rounded-lg border p-4 ${isToday ? 'border-primary bg-primary/5' : ''} ${isPast ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'EEEE, MMM d')}
                  {isToday && <span className="ml-2 text-xs text-primary">(Today)</span>}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No tasks scheduled</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} compact />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TodoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

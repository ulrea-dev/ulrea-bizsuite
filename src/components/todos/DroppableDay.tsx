import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DroppableDayProps {
  date: Date;
  dateStr: string;
  children: React.ReactNode;
  isToday: boolean;
  isPast: boolean;
  taskCount: number;
}

export const DroppableDay: React.FC<DroppableDayProps> = ({ 
  date, 
  dateStr, 
  children, 
  isToday, 
  isPast,
  taskCount,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { date: dateStr },
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "rounded-lg border p-4 min-h-[120px] transition-all",
        isToday && "border-primary bg-primary/5",
        isPast && !isToday && "opacity-60",
        isOver && "border-primary border-dashed bg-primary/10 scale-[1.02]"
      )}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn("font-medium", isToday && "text-primary")}>
          {format(date, 'EEEE, MMM d')}
          {isToday && <span className="ml-2 text-xs text-primary">(Today)</span>}
        </h3>
        <span className="text-sm text-muted-foreground">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Tasks Container */}
      <div className={cn(
        "space-y-2 min-h-[60px]",
        isOver && "ring-2 ring-primary/20 rounded-md p-2 -m-2"
      )}>
        {children}
        {taskCount === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            {isOver ? "Drop here to reschedule" : "No tasks scheduled"}
          </p>
        )}
      </div>
    </div>
  );
};

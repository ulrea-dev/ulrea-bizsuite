import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ToDo } from '@/types/business';
import { TodoItem } from './TodoItem';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableTodoItemProps {
  todo: ToDo;
}

export const DraggableTodoItem: React.FC<DraggableTodoItemProps> = ({ todo }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
    data: { todo },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...listeners} 
        {...attributes}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <TodoItem todo={todo} compact />
    </div>
  );
};

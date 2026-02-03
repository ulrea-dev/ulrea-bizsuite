import { AppData, ToDo } from '@/types/business';
import { BusinessAction } from './types';
import { addDays, addWeeks, addMonths } from 'date-fns';

/**
 * Calculate the next due date based on recurring pattern
 */
const calculateNextDueDate = (currentDueDate: string, pattern?: 'daily' | 'weekly' | 'monthly'): string => {
  const date = new Date(currentDueDate);
  let nextDate: Date;
  
  switch (pattern) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    default:
      nextDate = addDays(date, 1);
  }
  
  return nextDate.toISOString().split('T')[0];
};

/**
 * Generate a simple unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * To-Do Reducer
 * 
 * Handles all to-do related actions including CRUD operations,
 * task completion, recurring task management, and carrying forward overdue tasks.
 */
export const todoReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...(state.todos || []), action.payload],
      };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload.id
            ? { ...todo, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : todo
        ),
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: (state.todos || []).filter(todo => todo.id !== action.payload),
      };

    case 'COMPLETE_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload
            ? { 
                ...todo, 
                status: 'done', 
                completedAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
              }
            : todo
        ),
      };

    case 'COMPLETE_RECURRING_TODO': {
      const todo = (state.todos || []).find(t => t.id === action.payload);
      if (!todo || !todo.isRecurring) {
        // Fall back to regular complete if not recurring
        return {
          ...state,
          todos: (state.todos || []).map(t =>
            t.id === action.payload
              ? { ...t, status: 'done', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t
          ),
        };
      }

      const now = new Date().toISOString();
      const nextDueDate = calculateNextDueDate(todo.dueDate, todo.recurringPattern);
      
      // Check if we should stop recurring (end date reached)
      if (todo.recurringEndDate && nextDueDate > todo.recurringEndDate) {
        // Just complete, don't create new occurrence
        return {
          ...state,
          todos: (state.todos || []).map(t =>
            t.id === action.payload
              ? { ...t, status: 'done', completedAt: now, updatedAt: now }
              : t
          ),
        };
      }

      // Create the next occurrence
      const newTodo: ToDo = {
        ...todo,
        id: generateId(),
        dueDate: nextDueDate,
        originalDueDate: undefined, // Reset for new occurrence
        status: 'pending',
        completedAt: undefined,
        parentRecurringId: todo.parentRecurringId || todo.id,
        lastGeneratedDate: now,
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...state,
        todos: [
          ...(state.todos || []).map(t =>
            t.id === action.payload
              ? { ...t, status: 'done' as const, completedAt: now, updatedAt: now, lastGeneratedDate: now }
              : t
          ),
          newTodo,
        ],
      };
    }

    case 'CARRY_FORWARD_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload.id
            ? { 
                ...todo, 
                originalDueDate: todo.originalDueDate || todo.dueDate,
                dueDate: action.payload.newDueDate,
                updatedAt: new Date().toISOString() 
              }
            : todo
        ),
      };

    case 'BULK_CARRY_FORWARD_TODOS':
      return {
        ...state,
        todos: (state.todos || []).map(todo => {
          if (action.payload.ids.includes(todo.id)) {
            return {
              ...todo,
              originalDueDate: todo.originalDueDate || todo.dueDate,
              dueDate: action.payload.newDueDate,
              updatedAt: new Date().toISOString(),
            };
          }
          return todo;
        }),
      };

    default:
      return null;
  }
};

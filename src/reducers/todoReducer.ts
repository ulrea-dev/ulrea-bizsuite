import { AppData, ToDo } from '@/types/business';
import { BusinessAction } from './types';
import { addDays, addWeeks, addMonths } from 'date-fns';

const calculateNextDueDate = (currentDueDate: string, pattern?: 'daily' | 'weekly' | 'monthly'): string => {
  const date = new Date(currentDueDate);
  let nextDate: Date;
  switch (pattern) {
    case 'daily': nextDate = addDays(date, 1); break;
    case 'weekly': nextDate = addWeeks(date, 1); break;
    case 'monthly': nextDate = addMonths(date, 1); break;
    default: nextDate = addDays(date, 1);
  }
  return nextDate.toISOString().split('T')[0];
};

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const todoReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_TODO':
      return { ...state, todos: [...(state.todos || []), action.payload] };

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
      return { ...state, todos: (state.todos || []).filter(todo => todo.id !== action.payload) };

    case 'COMPLETE_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload.id
            ? {
                ...todo,
                status: 'done' as const,
                completedAt: new Date().toISOString(),
                completedBy: action.payload.completedBy,
                completedByName: action.payload.completedByName,
                updatedAt: new Date().toISOString(),
              }
            : todo
        ),
      };

    case 'UNCOMPLETE_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload
            ? {
                ...todo,
                status: 'pending' as const,
                completedAt: undefined,
                completedBy: undefined,
                completedByName: undefined,
                updatedAt: new Date().toISOString(),
              }
            : todo
        ),
      };

    case 'COMPLETE_RECURRING_TODO': {
      const todo = (state.todos || []).find(t => t.id === action.payload.id);
      if (!todo || !todo.isRecurring) {
        return {
          ...state,
          todos: (state.todos || []).map(t =>
            t.id === action.payload.id
              ? {
                  ...t,
                  status: 'done' as const,
                  completedAt: new Date().toISOString(),
                  completedBy: action.payload.completedBy,
                  completedByName: action.payload.completedByName,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        };
      }

      const now = new Date().toISOString();
      const nextDueDate = calculateNextDueDate(todo.dueDate, todo.recurringPattern);

      if (todo.recurringEndDate && nextDueDate > todo.recurringEndDate) {
        return {
          ...state,
          todos: (state.todos || []).map(t =>
            t.id === action.payload.id
              ? { ...t, status: 'done' as const, completedAt: now, completedBy: action.payload.completedBy, completedByName: action.payload.completedByName, updatedAt: now }
              : t
          ),
        };
      }

      const newTodo: ToDo = {
        ...todo,
        id: generateId(),
        dueDate: nextDueDate,
        originalDueDate: undefined,
        status: 'pending',
        completedAt: undefined,
        completedBy: undefined,
        completedByName: undefined,
        parentRecurringId: todo.parentRecurringId || todo.id,
        lastGeneratedDate: now,
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...state,
        todos: [
          ...(state.todos || []).map(t =>
            t.id === action.payload.id
              ? { ...t, status: 'done' as const, completedAt: now, completedBy: action.payload.completedBy, completedByName: action.payload.completedByName, updatedAt: now, lastGeneratedDate: now }
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
                updatedAt: new Date().toISOString(),
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

import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * To-Do Reducer
 * 
 * Handles all to-do related actions including CRUD operations,
 * task completion, and carrying forward overdue tasks.
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

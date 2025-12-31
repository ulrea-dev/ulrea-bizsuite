import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Task Entity Reducer
 * 
 * Handles all CRUD operations for QuickTask entities.
 * Following Single Responsibility Principle.
 */
export const taskReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_QUICK_TASK':
      return { ...state, quickTasks: [...(state.quickTasks || []), action.payload] };

    case 'UPDATE_QUICK_TASK':
      return {
        ...state,
        quickTasks: (state.quickTasks || []).map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        ),
      };

    case 'DELETE_QUICK_TASK':
      return {
        ...state,
        quickTasks: (state.quickTasks || []).filter(task => task.id !== action.payload),
      };

    case 'COMPLETE_QUICK_TASK':
      return {
        ...state,
        quickTasks: (state.quickTasks || []).map(task =>
          task.id === action.payload.id
            ? { ...task, status: 'completed' as const, paidAt: action.payload.paidAt, updatedAt: new Date().toISOString() }
            : task
        ),
      };

    default:
      return null; // Not handled by this reducer
  }
};

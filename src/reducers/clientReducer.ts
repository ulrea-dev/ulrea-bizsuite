import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Client Entity Reducer
 * 
 * Handles all CRUD operations for Client, Retainer entities.
 * Following Single Responsibility Principle.
 */
export const clientReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    // Client actions
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };

    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id
            ? { ...client, ...action.payload.updates }
            : client
        ),
      };

    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload),
      };

    // Retainer actions
    case 'ADD_RETAINER':
      return { ...state, retainers: [...(state.retainers || []), action.payload] };

    case 'UPDATE_RETAINER':
      return {
        ...state,
        retainers: (state.retainers || []).map(retainer =>
          retainer.id === action.payload.id
            ? { ...retainer, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : retainer
        ),
      };

    case 'DELETE_RETAINER':
      return {
        ...state,
        retainers: (state.retainers || []).filter(retainer => retainer.id !== action.payload),
      };

    default:
      return null; // Not handled by this reducer
  }
};

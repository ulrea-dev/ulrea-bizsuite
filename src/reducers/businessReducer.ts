import { AppData, Business } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Business Entity Reducer
 * 
 * Handles all CRUD operations for Business entities.
 * Following Single Responsibility Principle.
 */
export const businessReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_BUSINESS':
      return { ...state, businesses: [...state.businesses, action.payload] };

    case 'UPDATE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.map(business =>
          business.id === action.payload.id
            ? { ...business, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : business
        ),
      };

    case 'DELETE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.filter(business => business.id !== action.payload),
      };

    case 'SET_CURRENT_BUSINESS':
      return { ...state, currentBusinessId: action.payload };

    default:
      return null; // Not handled by this reducer
  }
};

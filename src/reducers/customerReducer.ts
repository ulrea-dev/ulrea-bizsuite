import { AppData, Customer } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Customer Reducer
 * 
 * Handles all customer-related actions for product-based businesses.
 */
export const customerReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, action.payload],
      };

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };

    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };

    default:
      return null;
  }
};

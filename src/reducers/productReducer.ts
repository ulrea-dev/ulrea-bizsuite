import { AppData, Product } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Product Reducer
 * 
 * Handles all product-related actions for product-based businesses.
 */
export const productReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };

    case 'UPDATE_PRODUCT_STOCK':
      return {
        ...state,
        products: state.products.map(p => {
          if (p.id === action.payload.id) {
            const newStock = action.payload.type === 'add'
              ? p.currentStock + action.payload.quantity
              : p.currentStock - action.payload.quantity;
            return { ...p, currentStock: Math.max(0, newStock), updatedAt: new Date().toISOString() };
          }
          return p;
        }),
      };

    default:
      return null;
  }
};

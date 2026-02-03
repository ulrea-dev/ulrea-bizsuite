import { AppData } from '@/types/business';
import { BusinessAction } from './types';
import { businessReducer } from './businessReducer';
import { projectReducer } from './projectReducer';
import { teamReducer } from './teamReducer';
import { clientReducer } from './clientReducer';
import { paymentReducer } from './paymentReducer';
import { salaryReducer } from './salaryReducer';
import { settingsReducer } from './settingsReducer';
import { taskReducer } from './taskReducer';
import { accountReducer } from './accountReducer';
import { productReducer } from './productReducer';
import { customerReducer } from './customerReducer';

/**
 * Root Reducer
 * 
 * Combines all domain-specific reducers using reducer composition.
 * Following Open/Closed Principle - new reducers can be added
 * without modifying existing ones.
 * 
 * Each domain reducer returns null if it doesn't handle the action,
 * allowing the root reducer to try the next one.
 */

// List of all domain reducers
const domainReducers = [
  businessReducer,
  projectReducer,
  teamReducer,
  clientReducer,
  paymentReducer,
  salaryReducer,
  settingsReducer,
  taskReducer,
  accountReducer,
  productReducer,
  customerReducer,
];

export const rootReducer = (state: AppData, action: BusinessAction): AppData => {
  // Handle LOAD_DATA specially - it replaces the entire state
  if (action.type === 'LOAD_DATA') {
    return action.payload;
  }

  // Try each domain reducer until one handles the action
  for (const reducer of domainReducers) {
    const result = reducer(state, action);
    if (result !== null) {
      return result;
    }
  }

  // No reducer handled the action - return unchanged state
  console.warn(`Unhandled action type: ${action.type}`);
  return state;
};

// Re-export types for convenience
export type { BusinessAction } from './types';

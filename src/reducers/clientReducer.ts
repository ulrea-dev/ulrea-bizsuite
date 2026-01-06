import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Client Entity Reducer
 * 
 * Handles all CRUD operations for Client, Retainer, Renewal, and RenewalPayment entities.
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

    // Renewal actions (within retainer)
    case 'ADD_RENEWAL_TO_RETAINER':
      return {
        ...state,
        retainers: (state.retainers || []).map(retainer =>
          retainer.id === action.payload.retainerId
            ? { ...retainer, renewals: [...(retainer.renewals || []), action.payload.renewal], updatedAt: new Date().toISOString() }
            : retainer
        ),
      };

    case 'UPDATE_RENEWAL_IN_RETAINER':
      return {
        ...state,
        retainers: (state.retainers || []).map(retainer =>
          retainer.id === action.payload.retainerId
            ? {
                ...retainer,
                renewals: (retainer.renewals || []).map(renewal =>
                  renewal.id === action.payload.renewalId
                    ? { ...renewal, ...action.payload.updates }
                    : renewal
                ),
                updatedAt: new Date().toISOString(),
              }
            : retainer
        ),
      };

    case 'DELETE_RENEWAL_FROM_RETAINER':
      return {
        ...state,
        retainers: (state.retainers || []).map(retainer =>
          retainer.id === action.payload.retainerId
            ? {
                ...retainer,
                renewals: (retainer.renewals || []).filter(renewal => renewal.id !== action.payload.renewalId),
                updatedAt: new Date().toISOString(),
              }
            : retainer
        ),
      };

    // Renewal Payment actions
    case 'ADD_RENEWAL_PAYMENT':
      return { ...state, renewalPayments: [...(state.renewalPayments || []), action.payload] };

    case 'UPDATE_RENEWAL_PAYMENT':
      return {
        ...state,
        renewalPayments: (state.renewalPayments || []).map(payment =>
          payment.id === action.payload.id
            ? { ...payment, ...action.payload.updates }
            : payment
        ),
      };

    case 'DELETE_RENEWAL_PAYMENT':
      return {
        ...state,
        renewalPayments: (state.renewalPayments || []).filter(payment => payment.id !== action.payload),
      };

    default:
      return null; // Not handled by this reducer
  }
};

import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Account Reducer
 * Handles bank accounts, payables, and receivables
 */
export const accountReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    // Bank Account actions
    case 'ADD_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: [...state.bankAccounts, action.payload],
      };

    case 'UPDATE_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: state.bankAccounts.map((account) =>
          account.id === action.payload.id
            ? { ...account, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : account
        ),
      };

    case 'DELETE_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: state.bankAccounts.filter((account) => account.id !== action.payload),
      };

    // Payable actions
    case 'ADD_PAYABLE':
      return {
        ...state,
        payables: [...state.payables, action.payload],
      };

    case 'UPDATE_PAYABLE':
      return {
        ...state,
        payables: state.payables.map((payable) =>
          payable.id === action.payload.id
            ? { ...payable, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : payable
        ),
      };

    case 'DELETE_PAYABLE':
      return {
        ...state,
        payables: state.payables.filter((payable) => payable.id !== action.payload),
      };

    // Receivable actions
    case 'ADD_RECEIVABLE':
      return {
        ...state,
        receivables: [...state.receivables, action.payload],
      };

    case 'UPDATE_RECEIVABLE':
      return {
        ...state,
        receivables: state.receivables.map((receivable) =>
          receivable.id === action.payload.id
            ? { ...receivable, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : receivable
        ),
      };

    case 'DELETE_RECEIVABLE':
      return {
        ...state,
        receivables: state.receivables.filter((receivable) => receivable.id !== action.payload),
      };

    default:
      return null;
  }
};

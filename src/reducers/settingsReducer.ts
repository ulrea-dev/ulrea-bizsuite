import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Settings Entity Reducer
 * 
 * Handles all operations for UserSettings, ExchangeRates, CustomCurrencies.
 * Following Single Responsibility Principle.
 */
export const settingsReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    // User Settings actions
    case 'SET_USERNAME':
      return {
        ...state,
        userSettings: { ...state.userSettings, username: action.payload },
      };

    case 'SET_ACCOUNT_NAME':
      return {
        ...state,
        userSettings: { ...state.userSettings, accountName: action.payload },
      };

    case 'SET_THEME':
      return {
        ...state,
        userSettings: { ...state.userSettings, theme: action.payload },
      };

    case 'SET_FONT':
      return {
        ...state,
        userSettings: { ...state.userSettings, fontFamily: action.payload },
      };

    case 'SET_COLOR_PALETTE':
      return {
        ...state,
        userSettings: { ...state.userSettings, colorPalette: action.payload },
      };

    case 'SET_DEFAULT_CURRENCY':
      return {
        ...state,
        userSettings: { ...state.userSettings, defaultCurrency: action.payload },
      };

    // Custom Currency actions
    case 'ADD_CUSTOM_CURRENCY':
      return {
        ...state,
        customCurrencies: [...(state.customCurrencies || []), action.payload],
      };

    case 'DELETE_CUSTOM_CURRENCY':
      return {
        ...state,
        customCurrencies: (state.customCurrencies || []).filter(c => c.code !== action.payload),
      };

    // Service Type actions
    case 'ADD_SERVICE_TYPE':
      return {
        ...state,
        serviceTypes: [...(state.serviceTypes || []), action.payload],
      };

    case 'UPDATE_SERVICE_TYPE':
      return {
        ...state,
        serviceTypes: (state.serviceTypes || []).map(st =>
          st.id === action.payload.id ? { ...st, ...action.payload.updates } : st
        ),
      };

    case 'DELETE_SERVICE_TYPE':
      return {
        ...state,
        serviceTypes: (state.serviceTypes || []).filter(st => st.id !== action.payload),
      };

    // Exchange Rate actions
    case 'ADD_EXCHANGE_RATE':
      return { ...state, exchangeRates: [...state.exchangeRates, action.payload] };

    case 'UPDATE_EXCHANGE_RATE':
      return {
        ...state,
        exchangeRates: state.exchangeRates.map(rate =>
          rate.id === action.payload.id
            ? { ...rate, ...action.payload.updates }
            : rate
        ),
      };

    case 'DELETE_EXCHANGE_RATE':
      return {
        ...state,
        exchangeRates: state.exchangeRates.filter(rate => rate.id !== action.payload),
      };

    // User Business Access actions
    case 'UPDATE_USER_BUSINESS_ACCESS':
      return {
        ...state,
        userBusinessAccess: action.payload,
      };

    case 'SET_USER_ID':
      return {
        ...state,
        userSettings: { ...state.userSettings, userId: action.payload },
      };

    default:
      return null; // Not handled by this reducer
  }
};

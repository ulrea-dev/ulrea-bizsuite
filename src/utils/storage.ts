
import { AppData, Business, Project, TeamMember, Client, Payment, SUPPORTED_CURRENCIES } from '@/types/business';
import { getDefaultFont, getDefaultColorPalette } from './appearance';

const STORAGE_KEY = 'bizsuite-data';

const getInitialData = (): AppData => ({
  businesses: [],
  projects: [],
  teamMembers: [],
  partners: [],
  clients: [],
  payments: [],
  salaryRecords: [],
  salaryPayments: [],
  exchangeRates: [],
  customCurrencies: [],
  currentBusinessId: null,
  userSettings: {
    username: '',
    theme: 'light',
    defaultCurrency: SUPPORTED_CURRENCIES[0], // USD
    fontFamily: getDefaultFont(),
    colorPalette: getDefaultColorPalette(),
  },
});

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getInitialData();
    
    const data = JSON.parse(stored) as AppData;
    const initialData = getInitialData();
    
    return {
      ...initialData,
      ...data,
      // Ensure arrays exist (for backward compatibility)
      partners: data.partners || [],
      salaryRecords: data.salaryRecords || [],
      salaryPayments: data.salaryPayments || [],
      exchangeRates: data.exchangeRates || [],
      customCurrencies: data.customCurrencies || [],
      // Ensure projects have clientPayments field (for backward compatibility)
      projects: (data.projects || []).map(project => ({
        ...project,
        clientPayments: project.clientPayments ?? 0,
      })),
      userSettings: {
        ...initialData.userSettings,
        ...data.userSettings,
      },
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return getInitialData();
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const exportData = (): string => {
  const data = loadData();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): AppData => {
  try {
    const data = JSON.parse(jsonString) as AppData;
    saveData(data);
    return data;
  } catch (error) {
    throw new Error('Invalid data format');
  }
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Helper functions
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatCurrency = (amount: number, currency: { symbol: string; code: string }): string => {
  let formattedAmount: string;
  
  if (Math.abs(amount) >= 1000000) {
    // Format millions
    formattedAmount = (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (Math.abs(amount) >= 1000) {
    // Format thousands
    formattedAmount = (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    // Format regular numbers
    formattedAmount = amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }
  
  return `${currency.symbol}${formattedAmount}`;
};

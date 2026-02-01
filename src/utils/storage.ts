/**
 * Storage Utilities
 * 
 * This file is maintained for backward compatibility.
 * New code should use the Repository pattern from @/repositories.
 * 
 * @deprecated Use LocalStorageRepository from @/repositories instead
 */

import { AppData, SUPPORTED_CURRENCIES } from '@/types/business';
import { getDefaultFont, getDefaultColorPalette } from './appearance';
import { localStorageRepository } from '@/repositories';

const STORAGE_KEY = 'bizsuite-data';

const getInitialData = (): AppData => ({
  // Core entities
  businesses: [],
  projects: [],
  teamMembers: [],
  partners: [],
  clients: [],
  payments: [],
  
  // Salary & Payroll
  salaryRecords: [],
  salaryPayments: [],
  payrollPeriods: [],
  payslips: [],
  
  // Financial
  exchangeRates: [],
  customCurrencies: [],
  expenses: [],
  extraPayments: [],
  bankAccounts: [],
  payables: [],
  receivables: [],
  
  // Service-based business entities
  quickTasks: [],
  retainers: [],
  renewals: [],
  renewalPayments: [],
  
  // Product-based business entities
  products: [],
  customers: [],
  salesOrders: [],
  productionBatches: [],
  purchaseOrders: [],
  
  // Access control
  userBusinessAccess: [],
  currentBusinessId: null,
  
  // User preferences
  userSettings: {
    username: '',
    userId: '',
    theme: 'light',
    defaultCurrency: SUPPORTED_CURRENCIES[0], // USD
    fontFamily: getDefaultFont(),
    colorPalette: getDefaultColorPalette(),
  },
});

/**
 * @deprecated Use localStorageRepository.load() instead
 */
export const loadData = (): AppData => {
  return localStorageRepository.load();
};

/**
 * @deprecated Use localStorageRepository.save() instead
 */
export const saveData = (data: AppData): void => {
  localStorageRepository.save(data);
};

/**
 * @deprecated Use localStorageRepository.export() instead
 */
export const exportData = (): string => {
  const exported = localStorageRepository.export();
  return JSON.stringify(exported, null, 2);
};

/**
 * @deprecated Use localStorageRepository.import() instead
 */
export const importData = (jsonString: string): AppData => {
  return localStorageRepository.import(jsonString);
};

/**
 * @deprecated Use localStorageRepository.clear() instead
 */
export const clearAllData = (): void => {
  localStorageRepository.clear();
};

/**
 * @deprecated Use localStorageRepository.generateId() instead
 */
export const generateId = (): string => {
  return localStorageRepository.generateId();
};

/**
 * Format currency with appropriate symbol and abbreviation
 * 
 * Note: This is a formatting utility, not a storage function.
 * Consider moving to @/utils/formatters.ts in a future refactor.
 */
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
